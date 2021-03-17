const assert = require('assert').strict;
const ConfigEntity = require('./configEntity');
const EntityFactory = require('../entityFactory');

class TextDisplayEntity extends ConfigEntity {
	static get TYPE()		{ return 'TextDisplay'; 							}
	static get GUITYPE()	{ return 'TextDisplay'; 							}
	static get BUILDER()	{ return value => new TextDisplayEntity(value); 	}
	
	// constructor(valueType) {
	constructor(value) {
		super();
		this.value = value;
	}
	
	getValue() {
		return this.value;
	}
	
	setValue(value) {
		assert(
			value || typeof value === 'string',
			`Illegal value: expected string, got ${value}`);
		
		this.value = value;
	}
	
	// ---- Overrides ---- //
	
	toConf() {
		return undefined;
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

module.exports = TextDisplayEntity;
