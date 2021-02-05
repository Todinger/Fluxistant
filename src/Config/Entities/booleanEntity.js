const ValueEntity = require('./valueEntity');

class BooleanEntity extends ValueEntity {
	static get TYPE()		{ return 'Boolean'; 							}
	static get GUITYPE()	{ return 'Boolean'; 							}
	static get BUILDER()	{ return value => new BooleanEntity(value); 	}
	
	constructor(value) {
		super(value, BooleanEntity.TYPE, 'boolean');
	}
}

module.exports = BooleanEntity;
