const StaticObjectEntity = require('./staticObjectEntity');

class ChoiceValueEntity extends StaticObjectEntity {
	static get TYPE() { return null; }	// Avoid construction (abstract type)
	
	constructor(type, optionName) {
		super(type);
		this.optionName = optionName;
	}
	
	// ---- Overrides ---- //
	
	toConf() {
		let conf = super.toConf();
		conf.optionName = this.optionName;
		return conf;
	}
	
	// Inject our 'type' field into the data
	export() {
		let descriptor = super.export();
		descriptor.type = this.type;
		return descriptor;
	}
}

module.exports = ChoiceValueEntity;
