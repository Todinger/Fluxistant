'use strict';

const assert = require('assert').strict;
const fsPromise = require('fs/promises');
const path = require('path');
const { Base64 } = require('js-base64');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');
const Errors = require('../errors');
const Utils = require('../utils');

// Base class for user asset files
class UserAssets {
	constructor(assetsDirPath) {
		this.assetsDirPath = assetsDirPath;
		Utils.ensureDirExists(this.assetsDirPath);
		
		this.savedFiles = {};       // Current state
		this.filesToAdd = {};       // Uncommitted new files
		this.filesToDelete = [];    // Uncommitted deletions
	}
	
	// Selects a file from the stored assets, according to the concrete class's own selection rules
	// noinspection JSUnusedLocalSymbols
	_getFileKeys(params) {
		Errors.abstract();
	}
	
	_pathFor(filename) {
		return path.join(this.assetsDirPath, filename);
	}
	
	_pathForKey(key, name) {
		name = name || this.savedFiles[key].name;
		return path.join(this.assetsDirPath, key + path.extname(name));
	}
	
	_addFile(file) {
		let fileKey = uuidv4();
		let readPromise = this._readFile(file.tempFilePath, file.name)
			.then(savedFile => {
				savedFile.fileKey = fileKey;
				return savedFile;
			});
		this.filesToAdd[fileKey] = {
			file,
			readPromise,
		};
		
		return readPromise;
	}
	
	_unAddFile(fileKey) {
		return this.filesToAdd[fileKey].readPromise
			.then(() => {
				let file = this.filesToAdd[fileKey].file;
				delete this.filesToAdd[fileKey];
				return fsPromise.unlink(file.tempFilePath);
			});
	}
	
	_deleteFile(key) {
		let filename = this.savedFiles[key].path;
		return fsPromise.unlink(filename)
			.then(() => {
				delete this.savedFiles[key];
				return key;
			})
			.catch(err => {
				delete this.savedFiles[key];
				console.warn(`Failed to delete file: ${err.message}`);
			});
	}
	
	hasKey(key) {
		return key in this.savedFiles;
	}
	
	upload(params) {
		return this._addFile(params.file);
	}
	
	delete(params) {
		if (params.fileKey in this.filesToAdd) {
			return this._unAddFile(params.fileKey);
		} else if ((params.fileKey in this.savedFiles) &&
			!this.filesToDelete.includes(params.fileKey)) {
				this.filesToDelete.push(params.fileKey);
		}
		
		return Promise.resolve();
	}
	
	commitChanges() {
		// First remove everything marked for removal
		let deletePromises = this.filesToDelete.map(
			fileKey => this._deleteFile(fileKey));
		
		// Then add everything marked for addition (this is so that
		// if we remove and add something with the same name - i.e.
		// replace it - then it'll work properly
		return Promise.all(deletePromises).catch().then(deletedKeys => {
			Utils.ensureDirExists(this.assetsDirPath);
			_.pullAll(this.filesToDelete, deletedKeys);
			let movePromises = [];
			Object.keys(this.filesToAdd).forEach(fileKey => {
				let file = this.filesToAdd[fileKey].file;
				let filePath = this._pathForKey(fileKey, file.name);
				let promise = file.mv(filePath)
					.then(() => {
						this.savedFiles[fileKey] = {
							name: file.name,
							path: filePath,
						};
						delete this.filesToAdd[fileKey];
					});
				movePromises.push(promise);
			});
			
			return Promise.all(movePromises);
		});
	}
	
	dropChanges() {
		this.filesToDelete = [];
		
		let promises = [];
		Object.keys(this.filesToAdd).forEach(fileKey => {
			promises.push(this._unAddFile(fileKey));
		});
		
		return Promise.all(promises);
	}
	
	selectFileLocal(...params) {
		let key = this.selectFileKey(...params);
		return {
			name: this.savedFiles[key].name,
			path: this.savedFiles[key].path,
			fileKey: key,
		};
	}
	
	_readFile(filePath, filename) {
		return fsPromise.readFile(filePath)
			.then((data) => {
				let b64Data = Base64.encode(data);
				let contentType = mime.contentType(filename);
				
				// I don't know why it gives it like this, but the web page
				// can't play it when it's "/wave" instead of "/wav"
				if (contentType === 'audio/wave') {
					contentType = 'audio/wav';
				}
				
				return {
					success: true,
					name: filename,
					contentType: contentType,
					data: `data:${contentType}; base64,${b64Data}`,
				};
			})
			.catch(err => {
				return {
					success: false,
					err: (err & err.message) || `${err}`,
				};
			});
	}
	
	getFileWebByKey(key) {
		return this._readFile(this.savedFiles[key].path, this.savedFiles[key].name)
			.then(file => {
				file.fileKey = key;
				return file;
			});
	}
	
	getFilesWeb(params) {
		let keys = this._getFileKeys(params);
		let promises = keys.map(key => (this.getFileWebByKey(key)));
		
		return Promise.all(promises);
	}
	
	// noinspection JSUnusedLocalSymbols
	selectFileKey(params) {
		Errors.abstract();
	}
	
	selectFile(...params) {
		let key = this.selectFileKey(...params);
		if (key) {
			return this.getFileWebByKey(key);
		} else {
			return Promise.resolve(null);
		}
	}
	
	import(exportedAssets) {
		assert(
			exportedAssets && exportedAssets.files,
			`Invalid exported file assets given for import: ${exportedAssets}`);
		
		// Added the '|| {}' part to shut the IDE up about it might being
		// null or undefined (despite our test above to make sure it isn't...)
		// let files = exportedAssets.files || {};
		this.savedFiles = exportedAssets.files || {};
	}
	
	export() {
		return { files: this.savedFiles };
	}
}

module.exports = UserAssets;