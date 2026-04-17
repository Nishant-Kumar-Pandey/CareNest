/**
 * Centralized Email Templates for CareNest
 */

const header = `
  <div style="background-color: #fdf8f3; padding: 20px; text-align: center; border-bottom: 3px solid #bc6c5c;">
    <h1 style="color: #bc6c5c; font-family: 'Times New Roman', serif; margin: 0; font-size: 28px;">🌿 CareNest</h1>
  </div>
`;

const footer = `
  <div style="background-color: #f9f9f9; padding: 20px; text-align: center; color: #777; font-size: 12px; border-top: 1px solid #eee; margin-top: 30px;">
    <p>© 2026 CareNest - Elderly Nursing & Healthcare Assistance Platform</p>
    <p>Premium care you can trust, delivered to your doorstep.</p>
  </div>
`;

const container = (content) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
    ${header}
    <div style="padding: 30px;">
      ${content}
    </div>
    ${footer}
  </div>
`;

exports.verificationEmail = (name, otp) => container(`
  <h2 style="color: #333 text-align: center;">Verify Your Email</h2>
  <p>Hello <strong>${name}</strong>,</p>
  <p>Thank you for joining CareNest! To complete your registration and secure your account, please use the following One-Time Password (OTP):</p>
  <div style="text-align: center; margin: 30px 0;">
    <span style="background-color: #fdf8f3; border: 2px dashed #bc6c5c; color: #bc6c5c; font-size: 32px; font-weight: bold; padding: 10px 30px; letter-spacing: 5px; border-radius: 4px;">${otp}</span>
  </div>
  <p>This code is valid for 10 minutes. If you did not sign up for an account, please ignore this email.</p>
  <p>Warm regards,<br/>The CareNest Team</p>
`);

exports.welcomeEmail = (name, role) => container(`
  <h2 style="color: #333;">Welcome to the Family!</h2>
  <p>Hello <strong>${name}</strong>,</p>
  <p>Your email has been successfully verified. We are absolutely thrilled to have you join our community as a <strong>${role}</strong>.</p>
  <p>Whether you're looking for world-class care or providing it, CareNest is here to make the experience seamless, safe, and dignified.</p>
  <div style="text-align: center; margin: 25px 0;">
    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" style="background-color: #bc6c5c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
  </div>
  <p>Welcome aboard!</p>
`);

exports.bookingUpdate = (name, status, bookingId) => container(`
  <h2 style="color: #333;">Booking Update</h2>
  <p>Hello <strong>${name}</strong>,</p>
  <p>There has been an update to your booking (ID: ${bookingId.toString().substring(0, 8)}...).</p>
  <p>The current status is now: <strong style="color: #bc6c5c; text-transform: uppercase;">${status}</strong>.</p>
  <p>Please log in to your dashboard to see more details and take any necessary actions.</p>
  <div style="text-align: center; margin: 25px 0;">
    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" style="background-color: #bc6c5c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Booking</a>
  </div>
`);
exports.paymentSuccessEmail = (name, amount, orderId) => container(`
  <h2 style="color: #333;">Payment Received! 💰</h2>
  <p>Hello <strong>${name}</strong>,</p>
  <p>We've successfully received your payment of <strong>₹${(amount / 100).toFixed(2)}</strong> for your booking (ID: ${orderId.substring(0, 8)}...).</p>
  <p>Your care session is now <strong>Confirmed</strong> and locked in. You can communicate with your caregiver through the platform chat at any time.</p>
  <div style="text-align: center; margin: 25px 0;">
    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" style="background-color: #bc6c5c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Confirmation</a>
  </div>
  <p>Thank you for choosing CareNest.</p>
`);

exports.loginAlertEmail = (name, time, ip = 'Unknown Device') => container(`
  <h2 style="color: #333;">New Sign-in Alert 🔒</h2>
  <p>Hello <strong>${name}</strong>,</p>
  <p>Your CareNest account has just been accessed from a new device or session.</p>
  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #bc6c5c;">
    <p style="margin: 0;"><strong>Time:</strong> ${time}</p>
    <p style="margin: 5px 0 0;"><strong>Device/Location:</strong> ${ip}</p>
  </div>
  <p>If this was you, you can safely ignore this email. If you did not sign in recently, please reset your password immediately for security.</p>
  <div style="text-align: center; margin: 15px 0;">
    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/auth?mode=forgot_password" style="color: #bc6c5c; font-weight: bold;">Secure my account</a>
  </div>
`);

exports.otpAlertEmail = (name, otp) => container(`
  <h2 style="color: #333; text-align: center;">Security Code</h2>
  <p>Hello <strong>${name}</strong>,</p>
  <p>You requested a security code for your CareNest account. Please use the following One-Time Password:</p>
  <div style="text-align: center; margin: 30px 0;">
    <span style="background-color: #fdf8f3; border: 2px solid #bc6c5c; color: #bc6c5c; font-size: 32px; font-weight: bold; padding: 10px 30px; letter-spacing: 5px; border-radius: 4px;">${otp}</span>
  </div>
  <p>This code is valid for 10 minutes. If you did not request this, please secure your account immediately.</p>
`);
