'use strict';

const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const safeWriteFile = require('crash-safe-write-file').writeFile;
const _ = require('lodash');
const cli = require('../cliManager');
const SingleFile = require('./singleFile');
const UniformPool = require('./uniformPool');
const WeightedPool = require('./weightedPool');
const NamedCollection = require('./namedCollection');
const UniformGroupsPool = require('./uniformGroupsPool');

const ASSETS_EXTENSION = '.assets.json';

class ModuleAssets {
	constructor(modName, assetsDirPath) {
		this.modName = modName;
		this.assetsDirPath = assetsDirPath;
		this.collections = {};
	}
	
	_verifyAbsence(collectionID) {
		assert(
			!(collectionID in this.collections),
			`Duplicate collection ID: ${collectionID}`);
		assert(
			!(collectionID in this),
			`Cannot use collection ID '${collectionID}' because it overrides a class member.`);
	}
	
	_verifyPresence(collectionID) {
		assert(
			collectionID in this.collections,
			`Unknown collection ID: ${collectionID}`);
	}
	
	_injectSave(callback) {
		return (...args) => {
			this.saveToDisk();
			callback(...args);
		};
	}
	
	add(collectionID, collectionClass) {
		let collection = new collectionClass(path.join(this.assetsDirPath, collectionID));
		this.collections[collectionID] = collection;
		this[collectionID] = collection;
	}
	
	addSingleFile(collectionID) {
		this._verifyAbsence(collectionID);
		this.add(collectionID, SingleFile);
		return this;
	}
	
	addUniformPool(collectionID) {
		this._verifyAbsence(collectionID);
		this.add(collectionID, UniformPool);
		return this;
	}
	
	addUniformGroupsPool(collectionID) {
		this._verifyAbsence(collectionID);
		this.add(collectionID, UniformGroupsPool);
		return this;
	}
	
	addWeightedPool(collectionID) {
		this._verifyAbsence(collectionID);
		this.add(collectionID, WeightedPool);
		return this;
	}
	
	addNamedCollection(collectionID) {
		this._verifyAbsence(collectionID);
		this.add(collectionID, NamedCollection);
		return this;
	}
	
	upload(params) {
		this._verifyPresence(params.collection);
		return this.collections[params.collection].upload(params);
	}
	
	delete(params) {
		this._verifyPresence(params.collection);
		return this.collections[params.collection].delete(params);
	}
	
	commitChanges() {
		return Promise.all(Object.values(this.collections).map(col => col.commitChanges()))
			.then(() => this.saveToDisk());
	}
	
	dropChanges() {
		return Promise.all(Object.values(this.collections).map(col => col.dropChanges()));
	}
	
	getFilesWeb(params) {
		this._verifyPresence(params.collection);
		return this.collections[params.collection].getFilesWeb(params);
	}
	
	getFileWeb(params) {
		this._verifyPresence(params.collection);
		return this.collections[params.collection].getFilesWeb(params)
			.then(files => {
				if (files.length === 0) {
					throw 'File not found';
				} else if (files.length > 1) {
					throw 'Got multiple files, expected one.';
				}
				
				return files[0];
			});
	}
	
	import(exportedAssets) {
		Object.keys(this.collections).forEach(collectionID => {
			this.collections[collectionID].import(exportedAssets[collectionID]);
		});
	}
	
	export() {
		let exportedAssets = {};
		Object.keys(this.collections).forEach(collectionID => {
			exportedAssets[collectionID] = this.collections[collectionID].export();
		});
		
		return exportedAssets;
	}
	
	_saveFilePath() {
		return path.join(this.assetsDirPath, this.modName + ASSETS_EXTENSION);
	}
	
	saveToDisk() {
		// If we have no collections it means the module has no assets - skip it
		if (_.isEmpty(this.collections)) {
			return;
		}
		
		let exportedAssets = this.export();
		let exportedAssetsString = JSON.stringify(exportedAssets, null, '\t');
		safeWriteFile(this._saveFilePath(), exportedAssetsString, (err) => {
			if (err) {
				cli.error(`Failed to write assets of '${this.modName}' module to file: ${err}`);
			}
		});
	}
	
	loadFromDisk() {
		// If we have no collections it means the module has no assets - skip it
		if (_.isEmpty(this.collections)) {
			return;
		}
		
		try {
			let exportedAssetsString = fs.readFileSync(this._saveFilePath());
			let exportedAssets = JSON.parse(exportedAssetsString);
			this.import(exportedAssets);
		} catch (err) {
			cli.warn(`Failed to load assets of '${this.modName}' module from disk: ${err}`);
		}
	}
}

module.exports = ModuleAssets;
