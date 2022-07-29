const assert = require('assert').strict;
const NaturalNumberEntity = require('./naturalNumberEntity');

class DegreesEntity extends NaturalNumberEntity {
	static get TYPE()		{ return 'Degrees'; 		        			}
	static get GUITYPE()	{ return 'Degrees'; 		        			}
	static get BUILDER()	{ return value => new DegreesEntity(value); 	}
	
	constructor(value) {
		super(value);
	}
	
	validate() {
		super.validate();
		assert(
			!this.isSet() || (this.getValue() <= 365),
			`This value must be between 0 and 365.`);
	}
	
	importDesc(descriptor, lenient) {
		super.importDesc(
			descriptor !== undefined ?
				(descriptor >= 0 && descriptor <= 365 ? descriptor : 0) :
				undefined,
			lenient);
	}
}

module.exports = DegreesEntity;
