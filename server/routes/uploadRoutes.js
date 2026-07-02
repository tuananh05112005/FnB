const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình nơi lưu trữ và tên tệp tạm
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Giới hạn và bộ lọc tệp
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Giới hạn kích thước tệp tối đa 20MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận các loại file ảnh! (jpeg, jpg, png, gif, webp)'));
    }
  }
}).single('image');

// Định nghĩa endpoint tải ảnh lên
router.post('/', (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Lỗi tải tệp lên: ' + err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn một file ảnh để tải lên!' });
    }

    // Nếu cấu hình đầy đủ Cloudinary, tiến hành upload lên Cloudinary vĩnh viễn
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'fnb_uploads',
        });

        // Xóa tệp tạm trên đĩa cục bộ sau khi đã đẩy lên đám mây thành công
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(200).json({
          message: 'Tải ảnh lên Cloudinary thành công!',
          url: result.secure_url
        });
      } catch (uploadError) {
        console.error('Lỗi upload Cloudinary, chuyển hướng sang fallback lưu đĩa:', uploadError);
        // Chạy tiếp xuống dưới để lưu cục bộ nếu Cloudinary gặp sự cố
      }
    }

    // Lưu cục bộ làm phương án dự phòng (Fallback)
    const host = req.get('host');
    const protocol = req.protocol;
    const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.status(200).json({
      message: 'Tải ảnh lên thành công (lưu cục bộ)!',
      url: imageUrl
    });
  });
});

module.exports = router;
