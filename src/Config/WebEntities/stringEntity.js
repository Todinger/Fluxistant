const ValueEntity = require('./valueEntity');

class StringEntity extends ValueEntity {
	static get TYPE()		{ return 'String'; 							}
	static get GUITYPE()	{ return 'String'; 							}
	static get BUILDER()	{ return value => new StringEntity(value); 	}
	
	constructor(value) {
		super(value, 'string');
	}
}

module.exports = StringEntity;
