const StaticObjectEntity = require('./staticObjectEntity');

class ChoiceValueEntity extends StaticObjectEntity {
	static get TYPE() { return null; }	// Avoid construction (abstract type)
	
	constructor(type, optionName) {
		super(type);
		this.optionName = optionName;
	}
	
	// ---- Overrides ---- //
	
	// Inject our 'type' field into the data
	_contentsToJSON() {
		let typeJSON = `"type": "${this.type}"`;
		let contentsJSON = super._contentsToJSON();
		return `${typeJSON},${contentsJSON}`;
	}
	
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
