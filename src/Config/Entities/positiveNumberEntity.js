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
}

module.exports = PositiveNumberEntity;
