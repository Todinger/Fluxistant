const assert = require('assert').strict;
const ConfigEntity = require('./configEntity');
const ValueEntity = require('./valueEntity');
const EntityFactory = require('../entityFactory');

class ObjectEntity extends ConfigEntity {
	static get TYPE() { return null; }	// Avoid construction (abstract type)
	
	constructor(type) {
		super(type || ObjectEntity.TYPE);
		this.children = {};
		this.allowImportingNewChildren = false;
	}
	
	getChild(key) {
		assert(key in this.children, `Key not found: ${key}.`);
		return this.children[key];
	}
	
	addChild(key, value) {
		assert(!(key in this.children), `Duplicate key added: ${key}.`);
		this.children[key] = value;
		return this.children[key];
	}
	
	hasChild(key) {
		return key in this.children;
	}
	
	_contentsToJSON() {
		let childJSONs = [];
		
		// Children that are undefined values are excluded from the JSON string
		// altogether - these are configurations options that weren't set and
		// should therefore not be in the configuration itself (this will allow
		// the program to use default values for those fields)
		Object.keys(this.children).map(key => {
			if (!ValueEntity.isUndefinedValue(this.children[key])) {
				childJSONs.push(`"${key}": ${this.children[key].toJSON()}`);
			}
		});
		
		return childJSONs.join();
	}
	
	
	// ---- Overrides ---- //
	
	toJSON() {
		let contents = this._contentsToJSON();
		return `{ ${contents} }`;
	}
	
	toConf() {
		let conf = {};
		Object.keys(this.children).map(key => {
			conf[key] = this.children[key].toConf();
		});
	}
	
	importDesc(descriptor) {
		Object.keys(descriptor).forEach(key => {
			console.log(`[ObjectEntity] Import key: ${key}`);
			console.log(`[ObjectEntity] Import value: ${JSON.stringify(descriptor[key])}`);
			if (key in this.children) {
				this.children[key].import(descriptor[key]);
			// } else if (this.allowImportingNewChildren) {
			// 	let child = ConfigEntity.readEntity(descriptor[key]);
			// 	this.addChild(child);
			} else {
				throw `Unknown child key: ${key}`;
			}
		});
	}
	
	export() {
		let data = {};
		Object.keys(this.children).forEach(key => {
			data[key] = this.children[key].export();
		});
		
		return {
			type: this.type,
			descriptor: data,
		}
	}
	
	validate() {
		Object.values(this.children).forEach(child => child.validate());
	}
	
	clone() {
		let copy = EntityFactory.build(this.type);
		Object.keys(this.children).forEach(key => {
			copy.addChild(key, this.children[key].clone());
		});
		return copy;
	}
}

module.exports = ObjectEntity;
