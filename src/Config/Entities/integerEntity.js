const NumberEntity = require('./numberEntity');

class IntegerEntity extends NumberEntity {
	static get TYPE()		{ return 'Integer'; 		        			}
	static get BUILDER()	{ return value => new IntegerEntity(value); 	}
	
	constructor(value) {
		super(value);
	}
	
	validate() {
		return  super.validate() &&
				(!this.isSet() || this.getValue().isInteger());
	}
}

module.exports = IntegerEntity;
