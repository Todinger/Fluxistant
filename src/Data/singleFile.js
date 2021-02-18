'use strict';

const UserData = require('./userData');

// Represents data that contains only a single file.
class SingleFile extends UserData {
	static get SINGLE_KEY()  { return 'file'; }
	
	constructor(dataDirPath) {
		super(dataDirPath);
	}
	
	upload(file, callback) {
		if (this.hasKey(SingleFile.SINGLE_KEY)) {
			this._deleteFile(SingleFile.SINGLE_KEY);
		}
		
		this._save(SingleFile.SINGLE_KEY, file, callback);
	}
	
	_getFileKey() {
		return SingleFile.SINGLE_KEY;
	}
}

module.exports = SingleFile;
