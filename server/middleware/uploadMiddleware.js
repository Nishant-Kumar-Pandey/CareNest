const multer = require('multer');
const { profileStorage, chatStorage } = require('../config/cloudinary');

// Middleware for profile image upload (single file)
const uploadProfile = multer({ 
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('avatar');

// Middleware for chat media upload (single or multiple)
const uploadChatMedia = multer({ 
  storage: chatStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).array('files', 5); // Allow up to 5 files

module.exports = {
  uploadProfile,
  uploadChatMedia
};
