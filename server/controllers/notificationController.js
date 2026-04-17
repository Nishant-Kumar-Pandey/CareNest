const Notification = require('../models/Notification');

// @desc   Get all notifications for logged in user
// @route  GET /api/notifications
// @access Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    res.json({ 
      success: true, 
      count: notifications.length, 
      unreadCount,
      data: notifications 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Mark notification as read
// @route  PATCH /api/notifications/:id/read
// @access Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Mark all notifications as read
// @route  PATCH /api/notifications/mark-all-read
// @access Private
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc   Delete notification
// @route  DELETE /api/notifications/:id
// @access Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await notification.deleteOne();

    res.json({ success: true, message: 'Notification removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
