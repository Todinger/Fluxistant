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

const DATA_EXTENSION = '.data.json';

class ModuleData {
	constructor(modName, dataDirPath) {
		this.modName = modName;
		this.dataDirPath = dataDirPath;
		this.collections = {};
	}
	
	_validateAbsence(collectionID) {
		assert(
			!(collectionID in this.collections),
			`Duplicate collection ID: ${collectionID}`);
	}
	
	_validatePresence(collectionID) {
		assert(
			collectionID in this.collections,
			`Unknown collection ID: ${collectionID}`);
	}
	
	addSingleFile(collectionID) {
		this._validateAbsence(collectionID);
		this.collections[collectionID] = new SingleFile(
			path.join(this.dataDirPath, collectionID));
		return this;
	}
	
	addUniformPool(collectionID) {
		this._validateAbsence(collectionID);
		this.collections[collectionID] = new UniformPool(
			path.join(this.dataDirPath, collectionID));
		return this;
	}
	
	addWeightedPool(collectionID) {
		this._validateAbsence(collectionID);
		this.collections[collectionID] = new WeightedPool(
			path.join(this.dataDirPath, collectionID));
		return this;
	}
	
	upload(collection, file, callback) {
		this._validatePresence(collection);
		this.collections[collection].upload(file, (err, encodedData) => {
			this.saveToDisk();
			callback(err, encodedData);
		});
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
