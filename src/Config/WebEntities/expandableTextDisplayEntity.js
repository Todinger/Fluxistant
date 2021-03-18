const TextDisplayEntity = require('./textDisplayEntity');

class ExpandableTextDisplayEntity extends TextDisplayEntity {
	static get TYPE()		{ return 'ExpandableTextDisplay'; 							}
	static get GUITYPE()	{ return 'ExpandableTextDisplay'; 							}
	static get BUILDER()	{ return value => new ExpandableTextDisplayEntity(value); 	}
	
	constructor(value) {
		super(value);
	}
	
	_assignableFrom(type) {
		return super._assignableFrom(type) ||
			type === 'TextDisplay';
	}
}

module.exports = ExpandableTextDisplayEntity;
