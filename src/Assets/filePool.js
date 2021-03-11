'use strict';

const UserAssets = require('./userAssets');

// Represents assets that contain multiple files, of which we normally choose one at a time.
// Note that this is still an abstract class, as it does not specify how to choose a key
// from our pool.
class FilePool extends UserAssets {
	constructor(assetsDirPath) {
		super(assetsDirPath);
	}
	
	_getFileKeys(params) {
		if (params.fileKey) {
			return [ params.fileKey ];
		} else {
			return Object.keys(this.savedFiles);
		}
	}
}

module.exports = FilePool;
