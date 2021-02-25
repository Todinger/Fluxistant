const assert = require('assert').strict;
const _ = require('lodash');
const ConfigEntity = require('./configEntity');
const EntityFactory = require('../entityFactory');

class ObjectEntity extends ConfigEntity {
	static get TYPE()		{ return null;		}	// Avoid construction (abstract type)
	static get GUITYPE()	{ return 'Object';	}
	
	constructor() {
		super();
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
		this._fillChildName(key);
		this.extendID(key, value);
		return this.children[key];
	}
	
	hasChild(key) {
		return key in this.children;
	}
	
	_fillChildName(key) {
		let child = this.children[key];
		if (!child.getName() || child.getName() === '') {
			child.setName(_.upperFirst(key));
		}
	}
	
	// ------------- Child Manufacturing ------------- //
	
	add(key, type, ...params) {
		let buildParams = params;
		buildParams.unshift(type);
		return this.addChild(key, EntityFactory.build.apply(EntityFactory, buildParams));
	}
	
	addString(key, defaultValue) {
		return this.add(key, 'String', defaultValue);
	}
	
	addNumber(key, defaultValue) {
		return this.add(key, 'Number', defaultValue);
	}
	
	addPositiveNumber(key, defaultValue) {
		return this.add(key, 'PositiveNumber', defaultValue);
	}
	
	addInteger(key, defaultValue) {
		return this.add(key, 'Integer', defaultValue);
	}
	
	addNaturalNumber(key, defaultValue) {
		return this.add(key, 'NaturalNumber', defaultValue);
	}
	
	addBoolean(key, defaultValue) {
		return this.add(key, 'Boolean', defaultValue);
	}
	
	addDynamicArray(key, valueType, values) {
		let array = this.add(key, 'DynamicArray', valueType);
		if (values) {
			values.forEach(value => {
				array.addElement(EntityFactory.build(valueType, value));
			});
		}
		
		return array;
	}
	
	addDynamicDataArray(key, colID, dataType, values) {
		let array = this.add(key, 'DynamicDataArray', colID, dataType);
		if (values) {
			values.forEach(value => {
				array.addElement(EntityFactory.build('Data', { colID, dataType }));
			});
		}
		
		return array;
	}
	
	addObject(key) {
		return this.add(key, 'StaticObject');
	}
	
	addData(key, configData) {
		return this.add(key, 'Data', configData);
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
		super.validate();
		Object.values(this.children).forEach(child => {
			this._performValidationStep(
				() => child.validate(),
				child.getName());
		});
	}
	
	buildFrom(descriptor) {
		Object.keys(descriptor).forEach(key => {
			let child = ConfigEntity.buildEntity(descriptor[key]);
			if (this.hasChild(key)) {
				this.setChild(key, child);
			} else {
				this.addChild(key, child);
			}
			
			this._fillChildName(key);
		});
	}
}


module.exports = ObjectEntity;
