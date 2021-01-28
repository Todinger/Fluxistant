const ConfigEntity = require('./configEntity');

class ValueEntity extends ConfigEntity {
	static get TYPE()		{ return 'Value'; 							}
	static get BUILDER()	{ return value => new ValueEntity(value); 	}
	
	static isUndefinedValue(entity) {
		return entity.type === ValueEntity.TYPE && entity.value === undefined;
	}
	
	// constructor(valueType) {
	constructor(value) {
		super(ValueEntity.TYPE);
		this.value = value;
	}
	
	getValue() {
		return this.value;
	}
	
	setValue(value) {
		this.value = value;
	}
	
	isSet() {
		return this.value !== undefined;
	}
	
	
	// ---- Overrides ---- //
	
	toConf() {
		return this.getValue();
	}
	
	importDesc(descriptor) {
		this.setValue(descriptor);
	}
	
	export() {
		return {
			type: this.type,
			descriptor: this.value,
		};
	}
	
	clone() {
		return new ValueEntity(this.value);
	}
}

module.exports = ValueEntity;
