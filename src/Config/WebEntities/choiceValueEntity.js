const StaticObjectEntity = require('./staticObjectEntity');

class ChoiceValueEntity extends StaticObjectEntity {
	static get TYPE()		{ return null;			}	// Avoid construction (abstract type)
	static get GUITYPE()	{ return 'RawObject';	}
	
	constructor(displayText) {
		super();
		this.displayText = displayText;
	}
	
	getDisplayText() {
		return this.displayText;
	}
	
	// ---- Overrides ---- //
	
	toConf() {
		let conf = super.toConf();
		conf.type = this.optionName;
		return conf;
	}
	
	cloneImpl() {
		let copy = super.cloneImpl();
		copy.optionName = this.optionName;
		return copy;
	}
}

module.exports = ChoiceValueEntity;
