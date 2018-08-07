
const { spawn } = require('child_process');
const uuidv4 = require('uuid/v4');
/////////////////////////////////////////         MULTER        /////////////////////////////////////////
const maxSize = 1024 * 1024 * 1024;
const multer = require('multer');
const fs = require('fs');
const upload = multer({
  fileFilter: (req, file, cb) => {
    if ((file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3') && (file.originalname).toLowerCase().split('.').pop() === 'mp3') {
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



module.exports.encode = (socket) => {
  const bitRate = socket.handshake.query.bitRate;
  const fileName = socket.handshake.query.file;
  fs.exists(process.env.ROOT_DIRECTORY + fileName, exists => {
    if (exists) {
      const child = spawn('lame', ['-b ' + bitRate, fileName, 'o-' + fileName], { cwd: process.env.ROOT_DIRECTORY });
      child.stderr.on('data', (data) => {
        let progress = extractProgress(data = data.toString().trim());
        if (progress) {
          socket.emit('progress', progress);
        }
      });
      child.on('exit', (code, signal) => {
        socket.emit('done', fileName);
      });
      child.on('error', (err) => {
        console.log(err);
      });
    }
  });
};

module.exports.download = (req, res, next) => {
  res.sendFile(process.env.ROOT_DIRECTORY + 'o-' + req.params.fileName, err => {
    if (err) {
      console.log(err);
    }
    fs.exists(process.env.ROOT_DIRECTORY + 'o-' + req.params.fileName, exists => {
      if (exists) {
        fs.unlink(process.env.ROOT_DIRECTORY + 'o-' + req.params.fileName);
      }
    });

    fs.exists(process.env.ROOT_DIRECTORY + req.params.fileName, exists => {
      if (exists) {
        fs.unlink(process.env.ROOT_DIRECTORY + req.params.fileName);
      }
    });
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