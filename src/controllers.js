const { spawn } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const exists = promisify(fs.exists);
const uploadHandler = require('./uploader');

const encode = async (socket) => {
  const bitRate = socket.handshake.query.bitRate;
  const fileName = socket.handshake.query.file;
  if (await exists(process.env.ROOT_DIRECTORY + fileName)) {
    const child = spawn('lame', ['-b ' + bitRate, fileName, 'o-' + fileName + '.mp3'], { cwd: process.env.ROOT_DIRECTORY });
    child.stderr.on('data', (data) => {
      let progress = extractProgress(data.toString().trim());
      if (progress) {
        socket.emit('progress', progress);
      }
    });

    child.on('exit', async (code) => {
      if (code === 0) {
        socket.emit('done', fileName);
      }
      else if (code === 255) {
        // The audio file headers are invalid
      }
      if (await exists(process.env.ROOT_DIRECTORY + fileName)) {
        fs.unlink(process.env.ROOT_DIRECTORY + fileName, err => { if (err) console.log(err); });
      }
    });

    child.on('error', (err) => {
      console.log(err);
    });
  }
};

const download = async (req, res) => {
  if (await exists(process.env.ROOT_DIRECTORY + 'o-' + req.params.fileName + '.mp3')) {
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
};

const upload = (req, res) => {
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

module.export = { download, upload, encode };

////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
  * Credits to node-lame for the code
  * https://github.com/jankarres/node-lame
*/

const extractProgress = (data) => {
  if (data.length > 6 && data.search(/[0-9]{1,10}\/[0-9]{1,10}/) > -1) {
    const progressMatch = data.match(/[0-9]{1,10}\/[0-9]{1,10}/);
    const progressAbsolute = progressMatch[0].split('/');
    const progress = Math.floor(Number(progressAbsolute[0]) / Number(progressAbsolute[1]) * 100);
    if (!isNaN(progress)) {
      return progress;
    }
  }
};