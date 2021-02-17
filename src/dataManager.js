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
	
	upload(modName, collection, file, callback) {
		assert(
			modName in this.moduleData,
			`Data upload to unknown module: ${modName}`);
		let modData = this.moduleData[modName];
		
		modData.upload(collection, file, callback);
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
