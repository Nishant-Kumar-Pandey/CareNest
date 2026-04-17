const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const User = require('../models/User');
const io = require('../socket');
const sendEmail = require('../utils/sendEmail');
const templates = require('../utils/emailTemplates');

// Mock credentials if not provided in .env
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret_abc123'
});

// @desc   Create Razorpay Order
// @route  POST /api/payments/create-order
// @access Private (Patient)
exports.createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('caregiver');
    
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.patient.toString() !== req.user.patientId?.toString() && req.user.role === 'patient') {
        // Wait, patient ID is strictly linked by user._id? Yes.
    }

    // Amount can be derived or passed. We'll default to 1000 INR for demo if not set.
    const amount = booking.amount || (booking.caregiver.hourlyRate * 100) || 100000; // stored in paise

    // Prevent 500 error if using fake keys by returning a mock order
    if (process.env.RAZORPAY_KEY_ID === undefined || process.env.RAZORPAY_KEY_ID === 'rzp_test_mockkey123' || !process.env.RAZORPAY_KEY_ID) {
      booking.razorpayOrderId = 'mock_order_' + Date.now();
      await booking.save();
      return res.status(200).json({ 
        success: true, 
        order: { id: booking.razorpayOrderId, amount, currency: 'INR', isMock: true } 
      });
    }

    const options = {
      amount: amount, // amount in paise
      currency: 'INR',
      receipt: `receipt_order_${booking._id}`,
    };

    const order = await razorpay.orders.create(options);
    
    // Save order generated id to booking
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.status(200).json({ success: true, order });
  } catch (err) {
    if (err.description) return res.status(400).json({ success: false, message: err.description });
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Verify Razorpay Payment Signature
// @route  POST /api/payments/verify
// @access Private (Patient)
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId, isMock } = req.body;

    let isAuthentic = false;

    if (isMock && razorpay_order_id.startsWith('mock_order_')) {
      isAuthentic = true;
    } else {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'mock_secret_abc123')
        .update(body.toString())
        .digest("hex");
      isAuthentic = expectedSignature === razorpay_signature;
    }

    if (isAuthentic) {
      // Payment matches, update booking!
      const booking = await Booking.findById(bookingId);
      booking.paymentStatus = 'paid';
      booking.status = 'confirmed'; // payment made, locked in
      booking.confirmedAt = new Date();
      await booking.save();

      // Trigger automated notifications & emails
      try {
        const patientUser = await User.findById(req.user._id);
        const caregiverUser = await User.findById(booking.caregiver.user || booking.caregiver);

        // 1. Email to Patient (Receipt)
        if (patientUser) {
          await sendEmail({
            to: patientUser.email,
            subject: 'Payment Successful - CareNest',
            html: templates.paymentSuccessEmail(patientUser.name, booking.amount || 100000, booking._id)
          });
        }

        // 2. Real-time Notification to Caregiver
        if (caregiverUser) {
          io.getIO().to(caregiverUser._id.toString()).emit('notification', {
             title: 'Payment Received! 💰',
             message: `Patient has paid for the booking. Status is Confirmed.`,
             bookingId: booking._id
          });
        }
      } catch(e) {
        console.error('Payment notification chain failed:', e.message);
      }
      
      res.status(200).json({ success: true, message: 'Payment verified successfully', booking });
    } else {
      res.status(400).json({ success: false, message: 'Invalid Signature' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
