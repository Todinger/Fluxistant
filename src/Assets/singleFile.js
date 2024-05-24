'use strict';

const UserAssets = require('./userAssets');

// Represents a single asset file.
class SingleFile extends UserAssets {
	static get SINGLE_KEY()  { return 'file'; }
	
	constructor(assetsDirPath, modName) {
		super(assetsDirPath, modName);
	}
	
	_getFileKeys() {
		return [ SingleFile.SINGLE_KEY ];
	}
}

module.exports = SingleFile;
