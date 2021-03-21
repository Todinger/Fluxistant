const async = require('async');
const fs = require('graceful-fs');
const mkdirp = require('mkdirp');
const MurmurHash3 = require('imurmurhash')
const path = require('path');

/**
 * Fully write or rewrite the datafile, immune to crashes during the write
 * operation. Writes to a temporary file like `write-file-atomic`, but flushes
 * all buffers using fsync.
 *
 * Adapted from https://github.com/louischatriot/nedb/blob/master/lib/storage.js.
 *
 * @param {String} filename   The destination file
 * @param {String} data       The data to write
 * @param {Function} callback Optional callback on completion or error
 */
function writeFile(filename, data, callback) {
  callback = callback || (() => {});
  const tempFilename = getTempFilename(filename);

  async.waterfall([
    async.apply(flushToStorage, { filename: path.dirname(filename), isDir: true }),
    (cb) => {
      fs.exists(filename, (exists) => {
        if (exists) {
          flushToStorage(filename, (err) => { return cb(err); });
        } else {
          return cb();
        }
      });
    },
    (cb) => {
      fs.writeFile(tempFilename, data, (err) => { return cb(err); });
    },
    async.apply(flushToStorage, tempFilename),
    (cb) => {
      fs.rename(tempFilename, filename, (err) => { return cb(err); });
    },
    async.apply(flushToStorage, { filename: path.dirname(filename), isDir: true })
  ], (err) => { return callback(err); })
}

/**
 * Flush data in OS buffer to storage.
 *
 * @param {Object|String} options   The fsync options as a string or object
 * @param {String} options.filename The file to flush to disk
 * @param {Boolean} options.isDir   Optional, defaults to false
 * @param {Function} callback       Optional callback on completion or error
 */
function flushToStorage(options, callback) {
  let filename, flags;
  if (typeof options === 'string') {
    filename = options;
    flags = 'r+';
  } else {
    filename = options.filename;
    flags = options.isDir ? 'r' : 'r+';
  }

  // Windows can't fsync (FlushFileBuffers) directories.
  if (flags === 'r' && process.platform === 'win32') {
    return callback(null);
  }

  fs.open(filename, flags, (err, fd) => {
    if (err) return callback(err);
    fs.fsync(fd, (errFS) => {
      fs.close(fd, (errC) => {
        if (errFS || errC) {
          const e = new Error('Failed to flush to storage');
          e.errorOnFsync = errFS;
          e.errorOnClose = errC;
          return callback(e);
        } else {
          return callback(null);
        }
      });
    });
  });
}

let invocations = 0;
function getTempFilename(filename) {
  return filename + '.' +
    MurmurHash3(__filename)
      .hash(String(process.pid))
      .hash(String(++invocations))
      .result()
}

module.exports = {
  writeFile
};