const ValueEntity = require('./valueEntity');

class NumberEntity extends ValueEntity {
	static get TYPE()		{ return 'Number'; 		        			}
	static get GUITYPE()	{ return 'Number';   		        		}
	static get BUILDER()	{ return value => new NumberEntity(value); 	}
	
	constructor(value) {
		super(value, 'number');
	}
	
	_assignableFrom(type) {
		return super._assignableFrom(type) ||
			type === 'Number' ||
			type === 'Integer' ||
			type === 'PositiveNumber';
	}
}

module.exports = NumberEntity;
