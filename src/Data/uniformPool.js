'use strict';

const FilePool = require('./filePool');
const Utils = require('../utils');

// Represents data that contains multiple files, of which we normally choose one at a time.
// The selection is done at random, with every file in the pool having the same odds of being chosen.
class UniformPool extends FilePool {
	constructor(dataDirPath) {
		super(dataDirPath);
	}
	
	_getFileKey() {
		return Utils.randomKey(this.files);
	}
}

module.exports = UniformPool;
