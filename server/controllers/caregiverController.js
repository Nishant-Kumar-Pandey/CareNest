const Caregiver = require('../models/Caregiver');
const { getCache, setCache, delCache } = require('../config/redis');

// @desc   Get all caregivers (with filters)
// @route  GET /api/caregivers
exports.getCaregivers = async (req, res) => {
  try {
    const cacheKey = `caregivers:${JSON.stringify(req.query)}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ success: true, data: cached, fromCache: true });

    const { specialization, minRate, maxRate, minRating, city, search, page = 1, limit = 12 } = req.query;
    const query = { profileComplete: true, isVerified: true };

    if (specialization) query.specializations = { $in: [specialization] };
    if (minRate || maxRate) {
      query.hourlyRate = {};
      if (minRate) query.hourlyRate.$gte = Number(minRate);
      if (maxRate) query.hourlyRate.$lte = Number(maxRate);
    }
    if (minRating) query.rating = { $gte: Number(minRating) };
    if (city) query['location.city'] = new RegExp(city, 'i');

    let dbQuery = Caregiver.find(query)
      .populate('user', 'name email phone avatar')
      .sort({ rating: -1 });

    if (search) {
      dbQuery = Caregiver.find({
        ...query,
        $or: [
          { bio: new RegExp(search, 'i') },
          { specializations: new RegExp(search, 'i') },
        ],
      }).populate('user', 'name email phone avatar').sort({ rating: -1 });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [caregivers, total] = await Promise.all([
      dbQuery.skip(skip).limit(Number(limit)),
      Caregiver.countDocuments(query),
    ]);

    const result = { caregivers, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
    await setCache(cacheKey, result, 120);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Get single caregiver
// @route  GET /api/caregivers/:id
exports.getCaregiver = async (req, res) => {
  try {
    const caregiver = await Caregiver.findById(req.params.id)
      .populate('user', 'name email phone avatar createdAt');
    if (!caregiver) return res.status(404).json({ success: false, message: 'Caregiver not found' });
    res.json({ success: true, data: caregiver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Update caregiver profile
// @route  PUT /api/caregivers/:id
exports.updateCaregiver = async (req, res) => {
  try {
    const caregiver = await Caregiver.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('user', 'name email phone avatar');
    if (!caregiver) return res.status(404).json({ success: false, message: 'Caregiver not found' });
    await delCache(`caregivers:*`);
    res.json({ success: true, data: caregiver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Get current user's caregiver profile
// @route  GET /api/caregivers/me
exports.getMyCaregiverProfile = async (req, res) => {
  try {
    const caregiver = await Caregiver.findOne({ user: req.user._id }).populate('user', 'name email phone avatar');
    if (!caregiver) return res.status(404).json({ success: false, message: 'Caregiver profile not found' });
    res.json({ success: true, data: caregiver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Create or update caregiver profile (Setup Wizard)
// @route  POST /api/caregivers/me
exports.createOrUpdateMyProfile = async (req, res) => {
  try {
    const { bio, specializations, experience, certifications, hourlyRate, languages, availability, location } = req.body;
    
    // The verify firewall ensures new caregivers stay false until Admin approves
    const caregiverFields = {
      user: req.user._id,
      bio, experience, hourlyRate, location,
      profileComplete: true 
    };
    
    if (specializations) caregiverFields.specializations = specializations;
    if (certifications) caregiverFields.certifications = certifications;
    if (languages) caregiverFields.languages = languages;
    if (availability) caregiverFields.availability = availability;

    let caregiver = await Caregiver.findOne({ user: req.user._id });

    if (caregiver) {
      caregiver = await Caregiver.findOneAndUpdate(
        { user: req.user._id },
        { $set: caregiverFields },
        { new: true, runValidators: true }
      );
      await delCache('caregivers:*');
      return res.status(200).json({ success: true, data: caregiver });
    }

    // Default to isVerified: false for new profiles
    caregiverFields.isVerified = false;
    caregiver = await Caregiver.create(caregiverFields);
    await delCache('caregivers:*');
    res.status(201).json({ success: true, data: caregiver });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
