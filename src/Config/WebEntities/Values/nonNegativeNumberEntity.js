const assert = require('assert').strict;
const NumberEntity = require('./numberEntity');

class NonNegativeNumberEntity extends NumberEntity {
	static get TYPE()		{ return 'NonNegativeNumber';							}
	static get GUITYPE()	{ return 'NonNegativeNumber';							}
	static get BUILDER()	{ return value => new NonNegativeNumberEntity(value);	}
	
	constructor(value) {
		super(value);
	}
	
	validate() {
		super.validate();
		assert(
			!this.isSet() || this.getValue() >= 0,
			`This value must be non-negative.`);
	}
	
	importDesc(descriptor, lenient) {
		super.importDesc(descriptor !== undefined ? (descriptor >= 0 ? descriptor : 0) : undefined, lenient);
	}
}

module.exports = NonNegativeNumberEntity;
