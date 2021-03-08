'use strict';

const assert = require('assert').strict;
const FilePool = require('./filePool');
const Utils = require('../utils');
const Errors = require('../errors');

// Represents data that contains multiple files, of which we normally choose one at a time.
// The selection is done at random, with every file in the pool having its own chances of being chosen,
// based on a weight value provided for each key.
// By default all keys are assigned a weight value of 1. If this isn't changed then this object behaves
// like a UniformPool. If weights are given, then a key with a weight of 3 has three times the chance
// of being selected than a key with a weight of 1.
// Weights are relative, so if all keys have the same weight, be it 1 or 31415926, it will still act as
// a uniform pool (there's no change to efficiency with different weight values, by the way).
class WeightedPool extends FilePool {
	constructor(dataDirPath) {
		super(dataDirPath);
		this.weights = {};
	}
	
	setWeight(key, weight) {
		assert(
			weight > 0,
			`Weight must be a positive number (got ${weight}).`);
		
		this.weights[key] = weight;
	}
	
	setWeights(weights) {
		Object.keys(weights).forEach(key => {
			this.setWeight(key, weights[key]);
		});
	}
	
	
	selectFileKey(weightAdjustmentFunction) {
		return Utils.weightedRandomKey(
			this.weights,
			weightAdjustmentFunction);
	}
	
	_addFile(params) {
		// Assign the default weight upon saving
		return super._addFile(params)
			.then(savedFile => {
				this.weights[savedFile.fileKey] = 1;
				return savedFile;
			});
	}
	
	_unAddFile(fileKey) {
		if (fileKey in this.weights) {
			delete this.weights[fileKey];
		}
		
		return super._unAddFile(fileKey);
	}
	
	_deleteFile(key) {
		delete this.weights[key];
		return super._deleteFile(key);
	}
	
	import(exportedData) {
		// Validate weights (each file should have one and nothing else)
		Errors.ensureKeysMatch(
			exportedData.files,
			exportedData.weights,
			"Weights data doesn't match files data.");
		
		super.import(exportedData);
		this.weights = exportedData.weights;
	}
	
	export() {
		let exportedData = super.export();
		exportedData.weights = this.weights;
		return exportedData;
	}
}

module.exports = WeightedPool;
