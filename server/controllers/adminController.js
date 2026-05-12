const Caregiver = require('../models/Caregiver');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Service = require('../models/Service');
const sendEmail = require('../utils/sendEmail');
const templates = require('../utils/emailTemplates');
const { getCache, setCache } = require('../config/redis');

// @desc   Get all pending caregivers for admin review
// @route  GET /api/admin/pending-caregivers
// @access Private/Admin
exports.getPendingCaregivers = async (req, res) => {
  try {
    const pending = await Caregiver.find({ isVerified: false, profileComplete: true })
      .populate('user', 'name email phone avatar createdAt')
      .sort({ createdAt: 1 });

    res.json({ success: true, count: pending.length, data: pending });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Approve/Verify a caregiver
// @route  PATCH /api/admin/verify-caregiver/:id
// @access Private/Admin
exports.verifyCaregiver = async (req, res) => {
  try {
    const caregiver = await Caregiver.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true, runValidators: true }
    ).populate('user', 'name email phone avatar');

    if (!caregiver) {
      return res.status(404).json({ success: false, message: 'Caregiver not found' });
    }

    const { sendNotification } = require('../utils/notifications');
    
    // Notify Caregiver
    await sendNotification(caregiver.user._id, {
      title: 'Profile Verified!',
      message: 'Congratulations! Your professional profile has been approved by our admin team.',
      type: 'VETTING_UPDATE',
      priority: 'high',
      emailSubject: 'Profile Verified! Welcome to the CareNest Team',
      emailHtml: templates.vettingStatusEmail(caregiver.user.name, 'approved', 'Your professional caregiver profile has been reviewed and fully verified by our admin team. You are now visible in our public directory and can begin receiving booking requests from families.')
    });

    res.json({ success: true, data: caregiver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Reject and delete a caregiver profile application
// @route  DELETE /api/admin/reject-caregiver/:id
// @access Private/Admin
exports.rejectCaregiver = async (req, res) => {
  try {
    const caregiver = await Caregiver.findById(req.params.id).populate('user');
    if (!caregiver) {
      return res.status(404).json({ success: false, message: 'Caregiver not found' });
    }

    const { email, name } = caregiver.user;

    await caregiver.deleteOne();
    
    // 1. Trigger automated rejection email
    try {
      await sendEmail({
        to: email,
        subject: 'Update regarding your CareNest Application',
        html: templates.vettingStatusEmail(name, 'rejected', 'Thank you for your interest in joining CareNest. After reviewing your profile and submitted credentials, we are unable to approve your application at this time. This decision is often based on incomplete documentation or specific certification requirements. You are welcome to re-apply in the future with updated credentials.')
      });
    } catch (emailErr) {
      console.error('Rejection email failed:', emailErr.message);
    }

    res.json({ success: true, message: 'Caregiver application rejected and removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Get core system metrics
// @route  GET /api/admin/metrics
// @access Private/Admin
exports.getSystemMetrics = async (req, res) => {
  try {
    // 1. Check Redis Cache
    const cacheKey = 'admin:metrics';
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData, cached: true });
    }

    // 2. Fetch fresh metrics
    const [
      totalUsers,
      totalCaregivers,
      totalPatients,
      totalBookings,
      pendingCaregivers,
      reviews,
      completedBookings,
      totalConfirmedTime
    ] = await Promise.all([
      User.countDocuments(),
      Caregiver.countDocuments({ isVerified: true }),
      Patient.countDocuments(),
      Booking.countDocuments(),
      Caregiver.countDocuments({ isVerified: false, profileComplete: true }),
      Review.find({}, 'rating'),
      Booking.countDocuments({ status: 'completed' }),
      Booking.aggregate([
        { $match: { confirmedAt: { $exists: true } } },
        { $group: { _id: null, totalResponseTime: { $sum: { $subtract: ["$confirmedAt", "$createdAt"] } }, count: { $sum: 1 } } }
      ])
    ]);

    // Aggregate monthly revenue or total revenue
    const revenueResult = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalCost' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Calculate Satisfaction Score
    const avgSatisfaction = reviews.length > 0 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
      : 5.0; // Default if no reviews

    // Calculate Booking Completion Rate
    const completionRate = totalBookings > 0 
      ? ((completedBookings / totalBookings) * 100).toFixed(1) 
      : 100;

    // Calculate Avg Response Time (minutes)
    let avgResponseTime = 0;
    if (totalConfirmedTime.length > 0 && totalConfirmedTime[0].count > 0) {
      avgResponseTime = Math.round((totalConfirmedTime[0].totalResponseTime / totalConfirmedTime[0].count) / 60000); 
    }

    // MAU (Monthly Active Users) - Last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } });

    const data = {
      totalUsers,
      totalCaregivers,
      totalPatients,
      totalBookings,
      pendingCaregivers,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      avgSatisfaction: parseFloat(avgSatisfaction),
      completionRate: parseFloat(completionRate),
      avgResponseTime,
      activeUsers
    };

    // 3. Store in Redis Cache (e.g. 5 minutes TTL = 300s)
    await setCache(cacheKey, data, 300);

    res.json({ success: true, data, cached: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Get all users for management
// @route  GET /api/admin/users
// @access Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Toggle user active status
// @route  PATCH /api/admin/users/:id/status
// @access Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Get all services for management
// @route  GET /api/admin/services
// @access Private/Admin
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ category: 1, name: 1 });
    res.json({ success: true, data: services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Create or update service
// @route  POST /api/admin/services
// @access Private/Admin
exports.upsertService = async (req, res) => {
  try {
    const { id, name, description, category, basePrice, duration, icon, features } = req.body;
    
    let service;
    if (id) {
      service = await Service.findByIdAndUpdate(id, {
        name, description, category, basePrice, duration, icon, features
      }, { new: true, runValidators: true });
    } else {
      const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      service = await Service.create({
        name, slug, description, category, basePrice, duration, icon, features
      });
    }

    const { delCache } = require('../config/redis');
    await delCache('services:all');

    res.json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

