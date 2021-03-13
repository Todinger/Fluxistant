const StringEntity = require('./stringEntity');

class HiddenStringEntity extends StringEntity {
	static get TYPE()		{ return 'HiddenString'; 							}
	static get GUITYPE()	{ return 'HiddenString'; 							}
	static get BUILDER()	{ return value => new HiddenStringEntity(value); 	}
	
	constructor(value) {
		super(value);
	}
	
	_assignableFrom(type) {
		return super._assignableFrom(type) ||
			type === 'String';
	}
}

module.exports = HiddenStringEntity;
