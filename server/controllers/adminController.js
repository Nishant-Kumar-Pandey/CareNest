const Caregiver = require('../models/Caregiver');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Booking = require('../models/Booking');
const sendEmail = require('../utils/sendEmail');
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
      emailHtml: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #4D8452;">Congratulations, ${caregiver.user.name}!</h1>
          <p>Your professional caregiver profile has been reviewed and **fully verified** by our admin team.</p>
          <p>You are now visible in our public directory and can begin receiving booking requests from families.</p>
          <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            <p>Next steps: Ensure your hourly rate and availability are up to date in your dashboard.</p>
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/caregiver" style="background: #C4694E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a>
          </div>
        </div>
      `
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
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #C4694E;">Application Status: Update</h2>
            <p>Hello ${name},</p>
            <p>Thank you for your interest in joining CareNest. After reviewing your profile and submitted credentials, we are unable to approve your application at this time.</p>
            <p>This decision is often based on incomplete documentation or specific certification requirements. You are welcome to re-apply in the future with updated credentials.</p>
            <p>Regards,<br/>The CareNest Quality Team</p>
          </div>
        `
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
      pendingCaregivers
    ] = await Promise.all([
      User.countDocuments(),
      Caregiver.countDocuments({ isVerified: true }),
      Patient.countDocuments(),
      Booking.countDocuments(),
      Caregiver.countDocuments({ isVerified: false, profileComplete: true })
    ]);

    // Aggregate monthly revenue or total revenue
    const revenueResult = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalCost' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    const data = {
      totalUsers,
      totalCaregivers,
      totalPatients,
      totalBookings,
      pendingCaregivers,
      totalRevenue: parseFloat(totalRevenue.toFixed(2))
    };

    // 3. Store in Redis Cache (e.g. 5 minutes TTL = 300s)
    await setCache(cacheKey, data, 300);

    res.json({ success: true, data, cached: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
