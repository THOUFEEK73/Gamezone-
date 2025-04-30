import multer from 'multer';

//Stores the files temporarily in memroy before uploading to cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Accept images only, including .avif
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP|avif|AVIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};


const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 40 * 1024 * 1024, // Increased to 20MB max file size
        // files: 5 // Maximum number of files (1 cover + 4 screenshots)
    }
}).fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'screenshots', maxCount: 4 }
]);

export default upload;