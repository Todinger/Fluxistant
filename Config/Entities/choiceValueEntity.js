const ObjectEntity = require('./objectEntity');
const Errors = require('../../errors');

class ChoiceValueEntity extends ObjectEntity {
	static get TYPE() { return null; }	// Avoid construction (abstract type)
	
	constructor(type) {
		super(type);
	}
	
	// _makeBasicData() {
	// 	return { type = this.type };
	// }
	
	// // Deriving classes should override this method and fill obj with the data
	// // relevant to the concrete object (no need to add the type; that'll be
	// // added where necessary already).
	// // No data is added by default, so choices that only need their type and
	// // have no other data only need to inherit from ChoiceValueEntity and define
	// // their type and builder.
	// _fillData(data) {
	// }
	
	// // This is actually the same as import(), but I put it in its own function
	// // to clarify that what we're reading is the data that we exported using
	// // _fillData().
	// _importData(data) {
	// }
	
	
	// ---- Overrides ---- //
	
	// Inject our 'type' field into the data
	_contentsToJSON() {
		let typeJSON = `"type": "${this.type}"`;
		let contentsJSON = super._contentsToJSON();
		return `${typeJSON},${contentsJSON}`;
	}
	
	toConf() {
		let conf = super.toConf();
		conf.type = this.type;
		return conf;
	}
	
	// Intentionally not implemented because we already get the type during
	// construction
	
	// Inject our 'type' field into the data
	export() {
		// let data = this._fillData(this._makeBasicData());
		// this._fillData(data);
		// return data;
		let descriptor = super.export();
		descriptor.type = this.type;
		return descriptor;
	}
}

module.exports = ChoiceValueEntity;
