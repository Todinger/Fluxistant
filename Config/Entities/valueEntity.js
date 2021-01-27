const Errors = require('../../errors');
const ConfigEntity = require('./configEntity');

const TYPE = 'Value';

class ValueEntity extends ConfigEntity {
	static get TYPE()		{ return 'Value'; 							}
	static get BUILDER()	{ return value => new ValueEntity(value); 	}
	
	static isUndefinedValue(entity) {
		return entity.type == ValueEntity.TYPE && entity.value === undefined;
	}
	
	// constructor(valueType) {
	constructor(value) {
		super(ValueEntity.TYPE);
		// this.valueType = valueType;
		this.value = value;
	}
	
	getValue() {
		return this.value;
	}
	
	setValue(value) {
		// Errors.verifyType(value, this.valueType);
		this.value = value;
	}
	
	isSet() {
		return this.value !== undefined;
	}
	
	
	// ---- Overrides ---- //
	
	toJSON() {
		return JSON.stringify(this.getValue());
	}
	
	toConf() {
		return this.getValue();
	}
	
	importDesc(descriptor) {
		console.log(`[ValueEntity] Imported value = ${descriptor}`);
		this.setValue(descriptor);
	}
	
	export() {
		console.log(`[ValueEntity] Exported value = ${this.value}`);
		return {
			type: this.type,
			descriptor: this.value,
		};
	}
	
	clone() {
		return new ValueEntity(this.value);
	}
	
	fromJSON() {
		this.setValue(JSON.parse(jsonValue));
	}
}

module.exports = ValueEntity;
