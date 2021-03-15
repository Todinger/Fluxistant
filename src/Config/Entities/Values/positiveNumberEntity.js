const assert = require('assert').strict;
const NumberEntity = require('./numberEntity');

class PositiveNumberEntity extends NumberEntity {
	static get TYPE()		{ return 'PositiveNumber';							}
	static get GUITYPE()	{ return 'Number';									}
	static get BUILDER()	{ return value => new PositiveNumberEntity(value);	}
	
	constructor(value) {
		super(value);
	}
	
	validate() {
		super.validate();
		assert(
			!this.isSet() || this.getValue() > 0,
			`This value must be positive.`);
	}
	
	importDesc(descriptor, lenient) {
		// Not sure what I can put here as a default, so I went with 1...
		super.importDesc(descriptor !== undefined ? (descriptor > 0 ? descriptor : 1) : undefined, lenient);
	}
}

module.exports = PositiveNumberEntity;
