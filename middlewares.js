const fs = require('fs');

module.exports.fileExists = (req, res, next) => {
  fs.exists(process.env.ROOT_DIRECTORY + req.params.inputFile, (exists) => {
    if (exists) {
      next();
    } else {
      return res.status(404).json({
        err: 'File not found',
        data: null
      });
    }
  });
};