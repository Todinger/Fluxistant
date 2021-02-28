'use strict';

const assert = require('assert').strict;
const fs = require('fs');
const fsPromise = require('fs/promises');
const path = require('path');
const { Base64 } = require('js-base64');
const mime = require('mime-types');
const Errors = require('../errors');
const cli = require('../cliManager');
const Utils = require('../utils');

// Base class for user data files
class UserData {
	constructor(dataDirPath) {
		this.dataDirPath = dataDirPath;
		Utils.ensureDirExists(dataDirPath);
		
		this.files = {};
	}
	
	// Selects a file from the stored data, according to the concrete class's own selection rules
	// noinspection JSUnusedLocalSymbols
	_getFileKey(...params) {
		Errors.abstract();
	}
	
	_pathFor(filename) {
		return path.join(this.dataDirPath, filename);
	}
	
	_pathForKey(key, name) {
		name = name || this.files[key].name;
		return path.join(this.dataDirPath, key + path.extname(name));
	}
	
	_save(key, file, callback) {
		let filePath = this._pathForKey(key, file.name);
		file.mv(filePath, async (err) => {
			if (err) {
				callback(err);
			} else {
				this.files[key] = {
					name: file.name,
					path: filePath,
				};
				
				try {
					let fileData = await this._getFileWebByKey(key);
					callback(undefined, fileData);
				} catch (err) {
					callback(err);
				}
			}
		});
	}
	
	_deleteFile(key, callback) {
		let filename = this.files[key].path;
		fs.unlink(filename, (err) => {
			if (err) {
				cli.warn(`Failed to delete file '${filename}': ${err}`);
			}
			
			if (callback) {
				callback(err);
			}
		});
		
		delete this.files[key];
	}
	
	hasKey(key) {
		return key in this.files;
	}
	
	// noinspection JSUnusedLocalSymbols
	upload(fileKey, file, callback) {
		Errors.abstract();
	}
	
	delete(key, callback) {
		if (key in this.files) {
			this._deleteFile(key, callback);
		}
	}
	
	getFileLocal(...params) {
		let key = this._getFileKey.apply(this, params);
		return this.files[key].path;
	}
	
	_getFileWebByKey(key) {
		return fsPromise.readFile(this.files[key].path)
		.then((data) => {
			let b64Data = Base64.encode(data);
			let contentType = mime.contentType(this.files[key].path);
			return {
				name: this.files[key].name,
				contentType: contentType,
				data: `data:${contentType}; base64,${b64Data}`,
			};
		});
		
		// fs.readFile(this.files[key].path, (err, data) => {
		// 	if (err) {
		// 		callback(err);
		// 	} else {
		// 		let b64Data = Base64.encode(data);
		// 		let contentType = mime.contentType(this.files[key].path);
		// 		let sourceString = `data:${contentType}; base64,${b64Data}`;
		// 		callback(err, sourceString);
		// 	}
		// });
	}
	
	getFileWeb(...params) {
		if (Object.keys(this.files).length === 0) {
			throw 'Cannot get file: data collection is empty.';
		}
		
		let key = this._getFileKey.apply(this, params);
		return this._getFileWebByKey(key);
	}
	
	import(exportedData) {
		assert(
			exportedData && exportedData.files,
			`Invalid exported file data given for import: ${exportedData}`);
		
		// Added the '|| {}' part to shut the IDE up about it might being
		// null or undefined (despite our test above to make sure it isn't...)
		// let files = exportedData.files || {};
		this.files = exportedData.files || {};
		// Object.keys(files).forEach(key => {
		// 	this.files[key] = {
		// 		name: files[key].name,
		// 		path: this._pathForKey(key, files[key]),
		// 	};
		// });
	}
	
	export() {
		// let filenames = {};
		// Object.keys(this.files).forEach(key => {
		// 	filenames[key] = {
		// 		name: this.files[key].name,
		// 		path:
		// 	};
		// });
		//
		// return { filenames };
		return { files: this.files };
	}
}

module.exports = UserData;
