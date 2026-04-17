const Notification = require('../models/Notification');
const User = require('../models/User');
const sendEmail = require('./sendEmail');
const io = require('../socket');

/**
 * Send a notification to a specific user
 * @param {string} userId - ID of the target user
 * @param {Object} data - { title, message, type, priority, actor, metadata, emailHtml, emailSubject }
 */
const sendNotification = async (userId, data) => {
  try {
    const { 
      title, 
      message, 
      type, 
      priority = 'medium', 
      actor = null, 
      metadata = {}, 
      emailHtml = null, 
      emailSubject = null 
    } = data;

    // 1. Save to Database
    const notification = await Notification.create({
      recipient: userId,
      actor,
      title,
      message,
      type,
      priority,
      metadata
    });

    // 2. Emit Real-Time Socket Event
    try {
      const ioInstance = io.getIO();
      ioInstance.to(userId.toString()).emit('notification', {
        id: notification._id,
        title,
        message,
        type,
        priority,
        metadata,
        createdAt: notification.createdAt
      });
      
      // If it's a high priority or system wide, we might also emit to 'admin' room
      if (priority === 'high' || type === 'VETTING_REQUIRED' || type === 'CRISIS_ALERT') {
        ioInstance.to('admin').emit('admin_pulse', {
          type,
          title,
          message,
          metadata
        });
      }
    } catch (socketErr) {
      console.error('Socket emission failed (Utility):', socketErr.message);
    }

    // 3. Optional Email Alert
    if (emailHtml && emailSubject) {
      try {
        const user = await User.findById(userId);
        if (user && user.email) {
          await sendEmail({
            to: user.email,
            subject: emailSubject,
            html: emailHtml
          });
        }
      } catch (emailErr) {
        console.error('Email alert failed (Utility):', emailErr.message);
      }
    }

    return notification;
  } catch (err) {
    console.error('Notification utility error:', err.message);
    // Don't throw - we don't want to crash the main request if notification fails
  }
};

/**
 * Broadcast a pulse event to all admins
 * @param {Object} data - { type, title, message, metadata }
 */
const broadcastAdminPulse = (data) => {
  try {
    const ioInstance = io.getIO();
    ioInstance.to('admin').emit('admin_pulse', data);
  } catch (err) {
    console.error('Admin broadcast failed:', err.message);
  }
};

module.exports = {
  sendNotification,
  broadcastAdminPulse
};
