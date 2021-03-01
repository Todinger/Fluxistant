'use strict';

const UserData = require('./userData');

// Represents data that contains multiple files, where we choose a file
// directly by its key.
class NamedCollection extends UserData {
	constructor(dataDirPath) {
		super(dataDirPath);
	}
	
	// upload(params) {
	// 	if (this.hasKey(params.fileKey)) {
	// 		this._deleteFile(params.fileKey);
	// 	}
	//
	// 	this._addFile(params.fileKey, params.file, callback);
	// }
	
	_getFileKey(params) {
		return params.fileKey;
	}
}

module.exports = NamedCollection;
