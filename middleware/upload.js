const multer = require('multer');

// Configure Multer storage to use memory (no resizing here)
const storage = multer.memoryStorage();  // Using memory storage to store files in memory (instead of disk)
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // Maximum file size: 5MB (can be adjusted as needed)
  fileFilter: (req, file, cb) => {
    console.log('Uploaded file:', file.originalname, 'MIME:', file.mimetype); // Debug the MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/vnd.microsoft.icon'];
    // Check file type, only allow JPEG, PNG images
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and ICO images are allowed.'));
    }
    cb(null, true);  // Accept file
  },
});

// Middleware to upload a single image (for profile, icons, or wallpapers)
const uploadImage = upload.single('image'); // 'image' is the field name in your form or request

module.exports = {
  uploadImage,
};
