const ValueEntity = require('./valueEntity');

class NumberEntity extends ValueEntity {
	static get TYPE()		{ return 'Number'; 		        			}
	static get GUITYPE()	{ return 'Number';   		        		}
	static get BUILDER()	{ return value => new NumberEntity(value); 	}
	
	constructor(value) {
		super(value);
	}
}

module.exports = NumberEntity;
