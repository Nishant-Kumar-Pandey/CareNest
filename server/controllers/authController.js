const { generateToken } = require('../middleware/auth');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Caregiver = require('../models/Caregiver');
const sendEmail = require('../utils/sendEmail');
const otpGenerator = require('otp-generator');
const crypto = require('crypto');
const templates = require('../utils/emailTemplates');

// @desc   Register user
// @route  POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    // Security measure to prevent malicious privilege escalation during signup
    const assignedRole = (role === 'admin') ? 'patient' : (role || 'patient');
    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      phone
    });

    // Generate Verification OTP
    const verificationOtp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
    const hashedVerificationOtp = crypto.createHash('sha256').update(verificationOtp).digest('hex');
    
    user.verificationOtp = hashedVerificationOtp;
    user.verificationOtpExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours for initial verification
    await user.save({ validateBeforeSave: false });

    // Send Verification Email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify Your CareNest Account',
        html: templates.verificationEmail(user.name, verificationOtp)
      });
    } catch (emailErr) {
      console.log('Verification email failed, user will need to resend:', emailErr.message);
    }

    // Auto-create profile
    if (user.role === 'patient') {
      await Patient.create({ user: user._id });
    } else if (user.role === 'caregiver') {
      await Caregiver.create({ user: user._id, hourlyRate: 25 });
    }

    const token = generateToken(user._id);

    const { broadcastAdminPulse } = require('../utils/notifications');
    broadcastAdminPulse({
      type: 'NEW_USER',
      title: 'New Member Joined',
      message: `${name} has just registered as a ${user.role}.`,
      metadata: { userId: user._id, role: user.role }
    });

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    console.error('REGISTRATION ERROR:', err);
    res.status(500).json({ success: false, message: err.message || 'Server Registration Error' });
  }
};

// @desc   Login user
// @route  POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    const token = generateToken(user._id);

    // Fetch profile status for smarter frontend routing
    let profileStatus = { profileComplete: false, isVerified: false };
    if (user.role === 'patient') {
      const patient = await Patient.findOne({ user: user._id });
      if (patient) profileStatus.profileComplete = patient.profileComplete || false;
    } else if (user.role === 'caregiver') {
      const caregiver = await Caregiver.findOne({ user: user._id });
      if (caregiver) {
        profileStatus.profileComplete = caregiver.profileComplete || false;
        profileStatus.isVerified = caregiver.isVerified || false;
      }
    }

    // Trigger Security Alert (Async)
    try {
      sendEmail({
        to: user.email,
        subject: 'New Sign-in Alert - CareNest',
        html: templates.loginAlertEmail(user.name, new Date().toLocaleString(), req.ip || 'Unknown Device')
      }).catch(e => console.error('Login alert failed:', e.message));
    } catch(e) {}

    res.json({ success: true, token, user, profileStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Verify Email OTP
// @route  POST /api/auth/verify-email
// @access Private/Public
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isEmailVerified) return res.status(400).json({ success: false, message: 'Email already verified' });

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    if (user.verificationOtp !== hashedOtp || user.verificationOtpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    user.isEmailVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // Send Welcome Email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to CareNest!',
        html: templates.welcomeEmail(user.name, user.role)
      });
    } catch (err) { /* ignore cleanup errors */ }

    // Generate fresh token with verified status
    const token = generateToken(user._id);

    res.status(200).json({ 
      success: true, 
      message: 'Email successfully verified',
      token,
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Forgot Password (Send OTP)
// @route  POST /api/auth/forgot-password
// @access Public
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'There is no user with that email.' });
    }

    // Generate 6-digit OTP
    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
    
    // Hash OTP for DB
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    user.resetPasswordOtp = hashedOtp;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Send email
    try {
      await sendEmail({
        to: user.email,
        subject: 'CareNest - Security OTP',
        html: templates.otpAlertEmail(user.name, otp)
      });
      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Reset Password
// @route  POST /api/auth/reset-password
// @access Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    // Hash the input OTP to compare with DB
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    if (user.resetPasswordOtp !== hashedOtp || user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Set new password (the pre-save hook will hash it)
    user.password = password;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Get current user
// @route  GET /api/auth/me
exports.getMe = async (req, res) => {
  let profileStatus = { profileComplete: false, isVerified: false };
  
  if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    if (patient) profileStatus.profileComplete = patient.profileComplete || false;
  } else if (req.user.role === 'caregiver') {
    const caregiver = await Caregiver.findOne({ user: req.user._id });
    if (caregiver) {
      profileStatus.profileComplete = caregiver.profileComplete || false;
      profileStatus.isVerified = caregiver.isVerified || false;
    }
  }

  res.json({ success: true, user: req.user, profileStatus });
};

// @desc   Upload/Update user avatar
// @route  POST /api/auth/upload-avatar
// @access Private
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image' });
    }

    const User = require('../models/User');
    const { cloudinary } = require('../config/cloudinary');
    
    const user = await User.findById(req.user._id);
    
    // Delete old image from Cloudinary if it exists
    if (user.avatar && user.avatar.includes('cloudinary')) {
      try {
        const publicId = user.avatar.split('/').slice(-3).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Failed to delete old avatar from Cloudinary:', err.message);
      }
    }

    user.avatar = req.file.path; // New Cloudinary URL
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      avatar: user.avatar
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
