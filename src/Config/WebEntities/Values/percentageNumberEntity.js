const assert = require('assert').strict;
const NumberEntity = require('./numberEntity');

class PercentageNumberEntity extends NumberEntity {
	static get TYPE()		{ return 'PercentageNumber';							}
	static get GUITYPE()	{ return 'PercentageNumber';							}
	static get BUILDER()	{ return value => new PercentageNumberEntity(value);	}
	
	constructor(value) {
		super(value);
	}
	
	validate() {
		super.validate();
		assert(
			!this.isSet() || (0 <= this.getValue() && this.getValue() <= 100),
			`This value must be between 0 and 100.`);
	}
	
	importDesc(descriptor, lenient) {
		super.importDesc(descriptor !== undefined ? (descriptor >= 0 ? descriptor : 0) : undefined, lenient);
	}
}

module.exports = PercentageNumberEntity;
