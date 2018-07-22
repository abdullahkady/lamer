
const { spawn } = require('child_process');
const uuidv4 = require('uuid/v4');


module.exports.test = (req, res, next) => {
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
}

////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
  * Credits to node-lame for the code
  * https://github.com/jankarres/node-lame
*/

extractProgress = (data) => {
  if (data.length > 6) {
    if (data.search(/[0-9]{1,10}\/[0-9]{1,10}/) > -1) {
      const progressMatch = data.match(/[0-9]{1,10}\/[0-9]{1,10}/);
      const progressAbsolute = progressMatch[0].split("/");
      const progress = Math.floor(Number(progressAbsolute[0]) / Number(progressAbsolute[1]) * 100);
      if (!isNaN(progress)) {
        return progress;
      }
    }
  }
}