'use strict';

const UserData = require('./userData');

// Represents data that contains multiple files, where we choose a file
// directly by its key.
class NamedCollection extends UserData {
	constructor(dataDirPath) {
		super(dataDirPath);
	}
	
	upload(fileKey, file, callback) {
		if (this.hasKey(fileKey)) {
			this._deleteFile(fileKey);
		}
		
		this._save(fileKey, file, callback);
	}
	
	_getFileKey(key) {
		return key;
	}
}

module.exports = NamedCollection;
