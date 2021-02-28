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
	
	_save(key, file, callback) {
		let filePath = this._pathFor(file.name);
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
		assert(key in this.files, `Cannot delete file: key '${key}' not found.`);
		this._deleteFile(key, callback);
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
			return `data:${contentType}; base64,${b64Data}`;
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
	
	getFileWeb(callback, ...params) {
		if (Object.keys(this.files).length === 0) {
			callback('Cannot get file: data collection is empty.');
			return;
		}
		
		let key = this._getFileKey.apply(this, params);
		return this._getFileWebByKey(key, callback);
	}
	
	import(exportedData) {
		assert(
			exportedData && exportedData.filenames,
			`Invalid exported file data given for import: ${exportedData}`);
		
		let filenames = exportedData.filenames;
		this.files = {};
		Object.keys(filenames).forEach(key => {
			this.files[key] = {
				name: filenames[key],
				path: this._pathFor(filenames[key]),
			};
		});
	}
	
	export() {
		let filenames = {};
		Object.keys(this.files).forEach(key => {
			filenames[key] = this.files[key].name;
		});
		
		return { filenames };
	}
}

module.exports = UserData;
