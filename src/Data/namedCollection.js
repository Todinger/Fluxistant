'use strict';

const assert = require('assert').strict;
const UserData = require('./userData');

// Represents data that contains multiple files, where we choose a file
// directly by its key.
class NamedCollection extends UserData {
	constructor(dataDirPath) {
		super(dataDirPath);
	}
	
	_ensurePresence(fileKey) {
		assert(
			fileKey,
			`Invalid key: "${fileKey}"`);
	}
	
	_getFileKeys(params) {
		this._ensurePresence(params.fileKey);
		return [ params.fileKey ];
	}
	
	_selectFileKey(fileKey) {
		this._ensurePresence(fileKey);
		return fileKey;
	}
}

module.exports = NamedCollection;
