const assert = require('assert').strict;
const ConfigEntity = require('./configEntity');
const ValueEntity = require('./valueEntity');
const EntityFactory = require('../entityFactory');

class ObjectEntity extends ConfigEntity {
	static get TYPE()		{ return 'Object'; 								}
	static get BUILDER()	{ return elementType => new ObjectEntity(); 	}
	
	constructor(type) {
		super(type || ObjectEntity.TYPE);
		this.children = {};
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
	
	import(descriptor) {
		descriptor.keys.forEach(key => {
			let child = ConfigEntity.readEntity(descriptor[key]);
			this.addChild(child);
		});
	}
	
	export() {
		let data = {};
		Object.keys(this.children).forEach(child => {
			data[child] = child.export();
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
	
	fromJSON() {
		this.setValue(JSON.parse(jsonValue));
	}
}

module.exports = ObjectEntity;
