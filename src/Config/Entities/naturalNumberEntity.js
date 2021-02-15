const assert = require('assert').strict;
const IntegerEntity = require('./integerEntity');

class NaturalNumberEntity extends IntegerEntity {
	static get TYPE()		{ return 'NaturalNumber'; 		        			}
	static get GUITYPE()	{ return 'NaturalNumber'; 		        			}
	static get BUILDER()	{ return value => new NaturalNumberEntity(value); 	}
	
	constructor(value) {
		super(value);
	}
	
	validate() {
		super.validate();
		assert(
			!this.isSet() || (this.getValue() >= 0),
			`This value cannot be negative.`);
	}
}

module.exports = NaturalNumberEntity;
