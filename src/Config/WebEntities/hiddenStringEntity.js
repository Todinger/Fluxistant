const StringEntity = require('./stringEntity');

class HiddenStringEntity extends StringEntity {
	static get TYPE()		{ return 'HiddenString'; 							}
	static get GUITYPE()	{ return 'HiddenString'; 							}
	static get BUILDER()	{ return value => new HiddenStringEntity(value); 	}
	
	constructor(value) {
		super(value);
	}
}

module.exports = HiddenStringEntity;
