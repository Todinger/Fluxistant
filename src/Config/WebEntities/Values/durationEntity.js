const assert = require('assert').strict;
const NumberEntity = require('./numberEntity');

const USER_SECONDS = 1000;

class DurationEntity extends NumberEntity {
	static get TYPE()		{ return 'Duration';							}
	static get BUILDER()	{ return value => new DurationEntity(value);	}
	
	constructor(value) {
		super(value);
	}
	
	validate() {
		super.validate();
		assert(
			!this.isSet() || this.getValue() >= 0,
			`This value must be non-negative.`);
	}
	
	importDesc(descriptor, lenient) {
		super.importDesc(descriptor !== undefined ? (descriptor >= 0 ? descriptor : 0) : undefined, lenient);
	}
	
	toConf() {
		return Math.round(this.getValue() * USER_SECONDS);
	}
}

module.exports = DurationEntity;
