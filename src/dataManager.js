'use strict';

const assert = require('assert').strict;
const path = require('path');
const ModuleData = require('./Data/moduleData');

const MODULES_SUBDIR = 'Modules';

class DataManager {
	constructor() {
		this.dataDirRoot = null;
		this.moduleData = {};
	}
	
	init(dataDirRoot) {
		this.dataDirRoot = dataDirRoot;
	}
	
	_verifyPresence(modName) {
		assert(
			modName in this.moduleData,
			`Data request for unknown module: ${modName}`);
	}
	
	addModule(modName) {
		assert(
			!(modName in this.moduleData),
			`Duplicate module in DataManager: ${modName}`);
		
		this.moduleData[modName] = new ModuleData(
			modName,
			path.join(
				this.dataDirRoot,
				MODULES_SUBDIR,
				modName));
		
		return this.moduleData[modName];
	}
	
	upload(modName, collection, fileKey, file, callback) {
		this._verifyPresence(modName);
		this.moduleData[modName].upload(collection, fileKey, file, callback);
	}
	
	delete(modName, collection, fileKey, callback) {
		this._verifyPresence(modName);
		this.moduleData[modName].delete(collection, fileKey, callback);
	}
	
	getFileWeb(modName, collection, fileKey) {
		this._verifyPresence(modName);
		return this.moduleData[modName].getFileWeb(collection, fileKey);
	}
	
	saveAll() {
		Object.values(this.moduleData).forEach(
			modData => modData.saveToDisk());
	}
	
	loadAll() {
		Object.values(this.moduleData).forEach(
			modData => modData.loadFromDisk());
	}
}

module.exports = new DataManager();
