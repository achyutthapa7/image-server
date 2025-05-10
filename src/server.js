import dotenv from "dotenv";
dotenv.config();
import express from "express";
import multer from "multer";

const app = express();
app.use("/image", express.static("./public/uploads"));

// ✅ Allowed image types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// ✅ File filter
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        "Invalid file type. Only images are allowed."
      ),
      false
    );
  }
};

// ✅ Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}_${file.originalname}`);
  },
});

const upload = multer({ storage, fileFilter });

// ✅ Upload route
app.post("/upload-image", upload.array("images", 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res
      .status(400)
      .json({ message: "No files uploaded or invalid file types." });
  }

  if (req.files.length > 5) {
    return res
      .status(413)
      .json({ message: "Cannot upload more than 5 images." });
  }

  const baseUrl = process.env.BASE_URL || `http://localhost:8000/image`;
  const fileUrls = req.files.map((file) => `${baseUrl}/${file.filename}`);

  res.status(200).json({ message: "Upload successful", fileUrls });
});

// ✅ Multer error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res
        .status(400)
        .json({ message: "Unexpected field or invalid file type." });
    }
    return res.status(400).json({ message: `Multer error: ${err.message}` });
  } else if (err) {
    // General errors
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
  next();
});

app.listen(8000, () => {
  console.log("✅ Image server running at http://localhost:8000");
});
