const ChoiceValueEntity = require('../choiceValueEntity');

class LogLevel_BaseEntity extends ChoiceValueEntity {
	static get TYPE()		{ return null;	}	// Avoid construction (abstract type)
	
	constructor(displayText) {
		super(displayText);
	}
	
	toConf() {
		return super.toConf().type;
	}
}

module.exports = LogLevel_BaseEntity;
