const multer = require("multer");
const { checkFileType } = require(".");
const FileStorage = require("./file-storage");

const keyPath = "resources/uploads/staff/images";

const fileStorage = new FileStorage();

const upload = multer({
  storage: fileStorage.multerS3(keyPath),
  limits: { fileSize: 2000000 }, // 2mb
  fileFilter: (req, file, callback) => {
    checkFileType(file, callback);
  },
}).single("profileImage");

module.exports = {
  uploadImage: upload,
};
