const multer = require('multer');
const uuidv4 = require('uuid/v4');
const maxSize = 1024 * 1024 * 100;

const uploadHandler = multer({
  fileFilter: (req, file, cb) => {
    if (validateFileType(file)) {
      return cb(null, true);
    }
    return cb('Error: File type not supported');
  },
  limits: { fileSize: maxSize, },
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, process.env.ROOT_DIRECTORY),
    filename: (req, file, cb) => cb(null, uuidv4() + extractExtension(file.originalname))
  })
}).single('audioFile');


const validateFileType = (file) => {
  const filetypes = /mp3|wav/;
  const mimetype = filetypes.test(file.mimetype);
  const fileExt = extractExtension(file.originalname);
  const extname = filetypes.test(fileExt);

  if (mimetype && extname) {
    return true;
  }
  return false;
};

const extractExtension = (fileName) => {
  return fileName.substr(fileName.lastIndexOf('.')).toLowerCase();
};

module.exports = uploadHandler;