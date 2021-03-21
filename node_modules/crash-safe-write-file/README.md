# crash-safe-write-file
Write a file atomically and use fsync to flush its contents.

Node.js file operations, even `writeFileSync`, cannot guarantee that the contents of the file were written.

From http://www.daveeddy.com/2013/03/26/synchronous-file-io-in-nodejs/:

>`fs.writeFileSync` is synchronous in the sense that it blocks the event loop while it executes. It does NOT ask the Kernel to do a synchronous write to the underlying file system.

This is fine for most cases, but if you're trying to write a file that's immune to crashes, you need to get into the [`fsync`](http://blog.httrack.com/blog/2013/11/15/everything-you-always-wanted-to-know-about-fsync/) game. This library borrows graciously from the storage methods in [`nedb`](https://github.com/louischatriot/nedb).

## Install
```
npm install crash-safe-write-file --save
```

## Usage
``` js
const writeFile = require('crash-safe-write-file').writeFile;
writeFile(filename, data, callback);
```
``` js
import {writeFile} from 'crash-safe-write-file';
writeFile(filename, data, callback);
```

## Signature
``` js
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
function writeFile(filename, data, callback);
```
