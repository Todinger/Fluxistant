const assert = require('assert').strict;
const ConfigEntity = require('./configEntity');

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
	
	
	// ---- Overrides ---- //
	
	toConf() {
		let conf = {};
		Object.keys(this.children).map(key => {
			conf[key] = this.children[key].toConf();
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
}

module.exports = ObjectEntity;
