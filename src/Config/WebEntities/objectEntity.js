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
		assert(this.hasChild(key), `Key not found: ${key}.`);
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
		assert(!(this.hasChild(key)), `Duplicate key added: ${key}.`);
		this.children[key] = value;
		this._fillChildName(key);
		this.extendID(key, value);
		return this.children[key];
	}
	
	hasChild(key) {
		return key in this.children;
	}
	
	removeChild(key) {
		assert(this.hasChild(key), `Key not found: ${key}.`);
		delete this.children[key];
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
	
	addHiddenString(key, defaultValue) {
		return this.add(key, 'HiddenString', defaultValue);
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
	
	addDynamicArray(key, valueType, values, ...itemConstructionOptions) {
		let array = this.add(key, 'DynamicArray', valueType, ...itemConstructionOptions);
		if (values) {
			values.forEach(value => {
				array.addElement(EntityFactory.build(valueType, value));
			});
		}
		
		return array;
	}
	
	addDynamicAssetArray(key, collection, dataType, values) {
		let array = this.add(key, 'DynamicDataArray', collection, dataType);
		if (values) {
			values.forEach(value => {
				array.addElement(EntityFactory.build('SingleAsset', { collection, dataType }, value));
			});
		}
		
		return array;
	}
	
	addObject(key) {
		return this.add(key, 'StaticObject');
	}
	
	addGroup(key) {
		return this.addObject(key);
	}
	
	addSingleAsset(key, configData) {
		return this.add(key, 'SingleAsset', configData);
	}
	
	addMultiAsset(key, configData) {
		return this.add(key, 'MultiAsset', configData);
	}
	
	addKeyShortcuts(key) {
		return this.add(key, 'KeyShortcuts');
	}
	
	
	// ---- Overrides ---- //
	
	setID(id) {
		super.setID(id);
		this.forEach((key, child) => this.extendID(key, child));
		return this;
	}
	
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