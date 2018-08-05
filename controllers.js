
const { spawn } = require('child_process');
const uuidv4 = require('uuid/v4');
/////////////////////////////////////////         MULTER        /////////////////////////////////////////
const maxSize = 1024 * 1024 * 1024;
const multer = require('multer');
const upload = multer({
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/mpeg' && (file.originalname).toLowerCase().split('.').pop() === 'mp3') {
      return cb(null, true);
    }
    cb('Error: File upload only supports mp3');
  },
  limits: { fileSize: maxSize, },
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads'),
    filename: (req, file, cb) => cb(null, uuidv4() + '.mp3')
  })
}).single('audioFile');



module.exports.encode = (req, res, next) => {
  const outputFileName = uuidv4() + '.mp3';
  const child = spawn('lame', ['-b ' + req.params.bitRate, req.params.inputFile, outputFileName], { cwd: process.env.ROOT_DIRECTORY });
  child.stderr.on('data', (data) => {
    let progress = extractProgress(data = data.toString().trim());
    if (progress) {
      console.log(progress);
    }
  });
  child.on('exit', (code, signal) => {
    return res.sendFile(process.env.ROOT_DIRECTORY + outputFileName);
  });
  child.on('error', (err) => {
    console.log(err);
  });
};

module.exports.upload = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(404).json({
        err
      });
    }
    if (!req.file) {
      return res.status(422).json({
        err: 'NO FILE SUPPLIED'
      });
    }
    return res.status(200).json({
      data: { fileName: req.file.filename }
    });
  });
};

////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
  * Credits to node-lame for the code
  * https://github.com/jankarres/node-lame
*/

const extractProgress = (data) => {
  if (data.length > 6) {
    if (data.search(/[0-9]{1,10}\/[0-9]{1,10}/) > -1) {
      const progressMatch = data.match(/[0-9]{1,10}\/[0-9]{1,10}/);
      const progressAbsolute = progressMatch[0].split('/');
      const progress = Math.floor(Number(progressAbsolute[0]) / Number(progressAbsolute[1]) * 100);
      if (!isNaN(progress)) {
        return progress;
      }
    }
  }
};