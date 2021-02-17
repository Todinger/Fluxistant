'use strict';

const FilePool = require('./filePool');

// Represents data that contains multiple files, where we choose a file
// directly by its key
class NamedPool extends FilePool {
	constructor(dataDirPath) {
		super(dataDirPath);
	}
	
	_getFileKey(key) {
		return key;
	}
}

module.exports = NamedPool;
