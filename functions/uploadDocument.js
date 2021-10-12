
const multer = require("multer");
const path = require("path");

const uploadPath = "./resources/uploads/staff/documents";

const storage = multer.diskStorage({
  destination: uploadPath,
  filename: (req, file, callback) => {
    callback(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Check file type
const checkFileType = (file, callback) => {
  // allowed ext
  const filetypes = /jpeg|jpg|png|gif|doc|docx|pdf/;
  // check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // check mime

  console.log(file);
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) return callback(null, true);
  return callback("Error: Invalid file type");
};

const upload = multer({
  storage,
  limits: { fileSize: 2000000 },
  fileFilter: (req, file, callback) => {
    checkFileType(file, callback);
  },
}).single("doc");



module.exports = {
  uploadUserDocument: upload,
};
