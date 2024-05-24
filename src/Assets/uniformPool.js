'use strict';

const FilePool = require('./filePool');
const Utils = require('../utils');

// Represents assets that contain multiple files, of which we normally choose one at a time.
// The selection is done at random, with every file in the pool having the same odds of being chosen.
class UniformPool extends FilePool {
	constructor(assetsDirPath, modName) {
		super(assetsDirPath, modName);
	}
	
	selectFileKey(params) {
		return Utils.randomKey(this.savedFiles);
	}
}

module.exports = UniformPool;
