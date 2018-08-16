
const { spawn } = require('child_process');
const fs = require('fs');
const uploadHandler = require('./uploader');

module.exports.encode = (socket) => {
  const bitRate = socket.handshake.query.bitRate;
  const fileName = socket.handshake.query.file;
  fs.exists(process.env.ROOT_DIRECTORY + fileName, exists => {
    if (exists) {
      const child = spawn('lame', ['-b ' + bitRate, fileName, 'o-' + fileName + '.mp3'], { cwd: process.env.ROOT_DIRECTORY });
      child.stderr.on('data', (data) => {
        let progress = extractProgress(data = data.toString().trim());
        if (progress) {
          socket.emit('progress', progress);
        }
      });

      child.on('exit', (code, signal) => {
        if (code === 0) {
          socket.emit('done', fileName);
        }
        else if (code === 255) {
          // The audio file headers are invalid
        }
        fs.exists(process.env.ROOT_DIRECTORY + fileName, exists => {
          if (exists) {
            fs.unlink(process.env.ROOT_DIRECTORY + fileName, err => { if (err) console.log(err); });
          }
        });
      });

      child.on('error', (err) => {
        console.log(err);
      });
    }
  });
};

module.exports.download = (req, res, next) => {
  fs.exists(process.env.ROOT_DIRECTORY + 'o-' + req.params.fileName + '.mp3', exists => {
    if (exists) {
      res.sendFile(process.env.ROOT_DIRECTORY + 'o-' + req.params.fileName + '.mp3', err => {
        if (err) {
          console.log(err);
        }
        fs.unlink(process.env.ROOT_DIRECTORY + 'o-' + req.params.fileName + '.mp3', err => { if (err) console.log(err); });
      });
    } else {
      return res.status(404).json({
        err: 'File not found'
      });
    }
  });
};

module.exports.upload = (req, res) => {
  uploadHandler(req, res, (err) => {
    if (err) {
      return res.status(404).json({
        err
      });
    }
    if (!req.file) {
      return res.status(422).json({
        err: 'No file supplied'
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
