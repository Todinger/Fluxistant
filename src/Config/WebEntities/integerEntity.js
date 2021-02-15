const assert = require('assert').strict;
const NumberEntity = require('./numberEntity');

class IntegerEntity extends NumberEntity {
	static get TYPE()		{ return 'Integer';							}
	static get GUITYPE()	{ return 'Integer';							}
	static get BUILDER()	{ return value => new IntegerEntity(value); }
	
	constructor(value) {
		super(value);
	}
	
	validate() {
		super.validate();
		assert(
			!this.isSet() || Number.isInteger(this.getValue()),
			`This value must be an integer (whole number).`);
	}
}

module.exports = IntegerEntity;
