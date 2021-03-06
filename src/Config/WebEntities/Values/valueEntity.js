const assert = require('assert').strict;
const ConfigEntity = require('../configEntity');
const EntityFactory = require('../../entityFactory');

class ValueEntity extends ConfigEntity {
	static get TYPE()		{ return 'Value'; 							}
	static get BUILDER()	{ return value => new ValueEntity(value); 	}
	
	static isUndefinedValue(entity) {
		return entity.type === ValueEntity.TYPE && entity.value === undefined;
	}
	
	constructor(value, javascriptValueType) {
		super();
		this.value = value;
		this.javascriptValueType = javascriptValueType;
	}
	
	getValue() {
		return this.value;
	}
	
	setValue(value) {
		if (this.javascriptValueType && value !== undefined) {
			assert(
				typeof value === this.javascriptValueType,
				`Illegal value: expected type '${this.javascriptValueType}', got ${value}`);
		}
		
		this.value = value;
		this.eChanged();
	}
	
	clearValue() {
		this.value = undefined;
		this.eChanged();
	}
	
	isSet() {
		return this.value !== undefined;
	}
	
	
	// ---- Overrides ---- //
	
	toConf() {
		return this.getValue();
	}
	
	importDesc(descriptor, lenient) {
		this.setValue(descriptor);
	}
	
	exportDesc() {
		return {
			descriptor: this.value,
		};
	}
	
	cloneImpl() {
		return EntityFactory.build(this.type, this.value);
	}
	
	buildFrom(descriptor) {
		this.setValue(descriptor);
	}
}

module.exports = ValueEntity;
