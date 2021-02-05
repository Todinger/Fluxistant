const assert = require('assert').strict;
const _ = require('lodash');
const ConfigEntity = require('./configEntity');

class ObjectEntity extends ConfigEntity {
	static get TYPE()		{ return null;		}	// Avoid construction (abstract type)
	static get GUITYPE()	{ return 'Object';	}
	
	constructor(type) {
		super(type || ObjectEntity.TYPE);
		this.children = {};
		this.allowImportingNewChildren = false;
	}
	
	getChild(key) {
		assert(key in this.children, `Key not found: ${key}.`);
		return this.children[key];
	}
	
	setChild(key, value) {
		this.children[key] = value;
		return this.children[key];
	}
	
	forEach(func) {
		Object.keys(this.children).forEach(key => func(key, this.children[key]));
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
		
		return conf;
	}
	
	exportDesc() {
		let data = {};
		Object.keys(this.children).forEach(key => {
			data[key] = this.children[key].export();
		});
		
		return {
			descriptor: data,
		}
	}
	
	validate() {
		Object.values(this.children).forEach(child => child.validate());
	}
	
	buildFrom(descriptor) {
		Object.keys(descriptor).forEach(key => {
			let child = ConfigEntity.buildEntity(descriptor[key]);
			if (this.hasChild(key)) {
				this.setChild(key, child);
			} else {
				this.addChild(key, child);
			}
			
			if (!child.hasName()) {
				child.setName(_.upperFirst(key));
			}
		});
	}
}


module.exports = ObjectEntity;
