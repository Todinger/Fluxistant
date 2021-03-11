'use strict';

const _ = require('lodash');
const UniformPool = require('./uniformPool');
const Utils = require('../utils');

// Represents assets that contain multiple files, of which we normally choose one at a time.
// The selection is done at random, with every file in the pool having the same odds of being chosen.
class UniformGroupsPool extends UniformPool {
	constructor(assetsDirPath) {
		super(assetsDirPath);
		this.groups = {};
	}
	
	hasGroupKey(groupKey) {
		return groupKey in this.groups;
	}
	
	addGroup(groupKey, group) {
		this.groups[groupKey] = group;
	}
	
	addGroups(groups) {
		_.assign(this.groups, groups);
	}
	
	clearGroups() {
		this.groups = {};
	}
	
	selectFileKey(groupKey) {
		return Utils.randomElement(this.groups[groupKey]);
	}
}

module.exports = UniformGroupsPool;
