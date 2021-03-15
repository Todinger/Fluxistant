const assert = require('assert').strict;
const ValueEntity = require('../Values/valueEntity');
const Enums = require('../../../Enums');

class KeyEntity extends ValueEntity {
	static get TYPE()		{ return 'Key';							}
	static get GUITYPE()	{ return 'Key';							}
	static get BUILDER()	{ return value => new KeyEntity(value);	}
	
	constructor(value) {
		super(value, 'string');
	}
	
	isValid() {
		let key = this.getValue();
		return !key || (key !== 'CHAR_UNDEFINED' && Enums.fromShortID(key));
	}
	
	validate() {
		super.validate();
		assert(
			this.isValid(),
			`Bad key code: ${this.getValue()}`);
	}
	
	getKey() {
		let value = this.getValue();
		if (value && value !== '') {
			return Enums.fromShortID(this.getValue()).htmlCode;
		} else {
			return undefined;
		}
	}
	
	setKey(htmlCode) {
		this.setValue(Enums.htmlCodeToShortID(htmlCode));
	}
	
	getKeyName() {
		let key = this.getValue();
		if (!key) {
			return 'No Key Set';
		} else if (!this.isValid()) {
			return 'Unknown Key';
		} else {
			return Enums.fromShortID(key).name;
		}
	}
}

module.exports = KeyEntity;
