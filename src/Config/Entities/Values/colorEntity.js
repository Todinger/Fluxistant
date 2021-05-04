const assert = require('assert').strict;
const ValueEntity = require('./valueEntity');

// Any text that starts with # followed by six hexadecimal digits (RGB)
// and another optional two digits (alpha value)
const COLOR_REGEX = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

class ColorEntity extends ValueEntity {
	static get TYPE()		{ return 'Color'; 							}
	static get GUITYPE()	{ return 'Color'; 							}
	static get BUILDER()	{ return value => new ColorEntity(value); 	}
	
	constructor(value) {
		super(value, 'string');
	}
	
	validate() {
		super.validate();
		assert(
			!this.isSet() || COLOR_REGEX.test(this.getValue()),
			`Bad color string: ${this.getValue()}`);
	}
}

module.exports = ColorEntity;
