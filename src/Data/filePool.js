'use strict';

const UserData = require('./userData');

// Represents data that contains multiple files, of which we normally choose one at a time.
// Note that this is still an abstract class, as it does not specify how to choose a key
// from our pool.
class FilePool extends UserData {
	constructor(dataDirPath) {
		super(dataDirPath);
	}
	
	upload(file, callback) {
		if (this.hasKey(file.name)) {
			this._deleteFile(file.name);
		}
		
		this._save(file.name, file, callback);
	}
}

module.exports = FilePool;
