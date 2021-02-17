'use strict';

const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const { Base64 } = require('js-base64');
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
		file.mv(filePath, (err) => {
			if (err) {
				callback(err);
			} else {
				this.files[key] = {
					name: file.name,
					path: filePath,
				};
				
				this._getFileWebByKey(key, callback);
			}
		});
	}
	
	_delete(key) {
		let filename = this.files[key].path;
		fs.unlink(filename, (err) => {
			if (err) {
				cli.warn(`Failed to delete file '${filename}': ${err}`);
			}
		});
		
		delete this[key];
	}
	
	hasKey(key) {
		return key in this.files;
	}
	
	// noinspection JSUnusedLocalSymbols
	upload(file, callback) {
		Errors.abstract();
	}
	
	getFileLocal(...params) {
		let key = this._getFileKey.apply(this, params);
		return this.files[key].path;
	}
	
	_getFileWebByKey(key, callback) {
		fs.readFile(this.files[key].path, (err, data) => {
			if (err) {
				callback(err);
			} else {
				callback(err, Base64.encode(data));
			}
		});
	}
	
	getFileWeb(callback, ...params) {
		let key = this._getFileKey.apply(this, params);
		this._getFileWebByKey(key, callback);
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
