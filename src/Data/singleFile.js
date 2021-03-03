'use strict';

const UserData = require('./userData');

// Represents data that contains only a single file.
class SingleFile extends UserData {
	static get SINGLE_KEY()  { return 'file'; }
	
	constructor(dataDirPath) {
		super(dataDirPath);
	}
	
	_getFileKeys() {
		return [ SingleFile.SINGLE_KEY ];
	}
}

module.exports = SingleFile;
