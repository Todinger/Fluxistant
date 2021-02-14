const StaticObjectEntity = require('./staticObjectEntity');

class ChoiceValueEntity extends StaticObjectEntity {
	static get TYPE()		{ return null;			}	// Avoid construction (abstract type)
	static get GUITYPE()	{ return 'RawObject';	}
	
	// constructor(type, optionName) {
	constructor(displayText) {
		super();
		// this.optionName = optionName;
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
	
	// Inject our 'type' field into the data
	// export() {
	// 	let descriptor = super.export();
	// 	descriptor.type = this.type;
	// 	return descriptor;
	// }
}

module.exports = ChoiceValueEntity;
