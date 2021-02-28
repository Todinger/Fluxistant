'use strict';

const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const cli = require('../cliManager');
const Errors = require('../errors');
const SingleFile = require('./singleFile');
const UniformPool = require('./uniformPool');
const WeightedPool = require('./weightedPool');
const NamedCollection = require('./namedCollection');

const DATA_EXTENSION = '.data.json';

class ModuleData {
	constructor(modName, dataDirPath) {
		this.modName = modName;
		this.dataDirPath = dataDirPath;
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
		let collection = new collectionClass(path.join(this.dataDirPath, collectionID));
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
	
	upload(collection, fileKey, file, callback) {
		this._verifyPresence(collection);
		this.collections[collection].upload(fileKey, file, this._injectSave(callback));
	}
	
	delete(collection, fileKey, callback) {
		this._verifyPresence(collection);
		this.collections[collection].delete(fileKey, this._injectSave(callback));
	}
	
	getFileWeb(collection, fileKey) {
		this._verifyPresence(collection);
		return this.collections[collection].getFileWeb(fileKey);
	}
	
	import(exportedData) {
		// Make sure that
		Errors.ensureKeysMatch(
			exportedData,
			this.collections,
			`Exported data doesn't match module configuration for ${this.modName}.`);
		
		Object.keys(this.collections).forEach(collectionID => {
			this.collections[collectionID].import(exportedData[collectionID]);
		});
	}
	
	export() {
		let exportedData = {};
		Object.keys(this.collections).forEach(collectionID => {
			exportedData[collectionID] = this.collections[collectionID].export();
		});
		
		return exportedData;
	}
	
	_saveFilePath() {
		return path.join(this.dataDirPath, this.modName + DATA_EXTENSION);
	}
	
	saveToDisk() {
		// If we have no collections it means the module has no data - skip it
		if (_.isEmpty(this.collections)) {
			return;
		}
		
		let exportedData = this.export();
		let exportedDataString = JSON.stringify(exportedData, null, '\t');
		fs.writeFile(this._saveFilePath(), exportedDataString, (err) => {
			if (err) {
				cli.error(`Failed to write data of '${this.modName}' module to file: ${err}`);
			}
		});
	}
	
	loadFromDisk() {
		// If we have no collections it means the module has no data - skip it
		if (_.isEmpty(this.collections)) {
			return;
		}
		
		try {
			let exportedDataString = fs.readFileSync(this._saveFilePath());
			let exportedData = JSON.parse(exportedDataString);
			this.import(exportedData);
		} catch (err) {
			cli.error(`Failed to load data of '${this.modName}' module from disk: ${err}`);
		}
	}
}

module.exports = ModuleData;
