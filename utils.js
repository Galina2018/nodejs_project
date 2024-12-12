const fs = require('fs');
const os = require('os');
const path = require('path');

function logLineAsync(logFilePath, logLine) {
  return new Promise((resolve, reject) => {
    const logDT = new Date();
    let time = logDT.toLocaleDateString() + ' ' + logDT.toLocaleTimeString();
    let fullLogLine = time + ' ' + logLine;

    console.log(fullLogLine);

    fs.open(logFilePath, 'a+', (err, logFd) => {
      if (err) reject(err);
      else
        fs.write(logFd, fullLogLine + os.EOL, (err) => {
          if (err) reject(err);
          else
            fs.close(logFd, (err) => {
              if (err) reject(err);
              else resolve();
            });
        });
    });
  });
}

module.exports = {
  logLineAsync,
};
