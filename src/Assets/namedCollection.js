'use strict';

const assert = require('assert').strict;
const UserAssets = require('./userAssets');

// Represents assets that contain multiple files, where we choose a file
// directly by its key.
class NamedCollection extends UserAssets {
	constructor(assetsDirPath, modName) {
		super(assetsDirPath, modName);
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
	
	selectFileKey(fileKey) {
		this._ensurePresence(fileKey);
		return fileKey;
	}
}

module.exports = NamedCollection;
