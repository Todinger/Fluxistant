'use strict';

const assert = require('assert').strict;
const path = require('path');
const ModuleData = require('./Assets/moduleAssets');

const MODULES_SUBDIR = 'Modules';

class AssetManager {
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
	
	upload(params) {
		this._verifyPresence(params.modName);
		return this.moduleData[params.modName].upload(params);
	}
	
	delete(params) {
		this._verifyPresence(params.modName);
		return this.moduleData[params.modName].delete(params);
	}
	
	commitChanges() {
		return Promise.all(Object.values(this.moduleData).map(col => col.commitChanges()));
	}
	
	dropChanges() {
		return Promise.all(Object.values(this.moduleData).map(col => col.dropChanges()));
	}
	
	getFilesWeb(params) {
		this._verifyPresence(params.modName);
		return this.moduleData[params.modName].getFilesWeb(params);
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

module.exports = new AssetManager();
