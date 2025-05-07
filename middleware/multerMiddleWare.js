import multer from 'multer';

// Stores the files temporarily in memory before uploading to cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Accept any image file type
    if (!file.mimetype.startsWith('image/')) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    }
}).fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'screenshots', maxCount: 4 }
]);

export default upload;