const assert = require('assert').strict;
const Errors = requireMain('./errors');
const StaticObjectEntity = require('../staticObjectEntity');

class AssetEntity extends StaticObjectEntity {
	static get TYPE()		{ return null; }
	
	static get SUPPORTED_DATA_TYPES() {
		return [
			'IMAGE',
			'SOUND',
			'VIDEO',
		];
	}
	
	constructor(data) {
		super();
		this.addString('collection', data && data.collection || '') // Identifies the collection for functional purposes
			.hide();
		this.addString('dataType', data && data.dataType || '')
			.hide();
	}
	
	getCollectionID() {
		return this.getChild('collection').getValue();
	}
	
	getDataType() {
		return this.getChild('dataType').getValue();
	}
	
	// ---- Overrides ---- //
	
	validate() {
		super.validate();
		
		let collection = this.getCollectionID();
		Errors.ensureNonEmptyString(
			collection,
			`collection must be a non-empty string. Got: ${collection}`);
		
		let dataType = this.getDataType();
		assert(
			AssetEntity.SUPPORTED_DATA_TYPES.includes(dataType),
			`Unsupported data type: ${dataType}`);
	}
}

module.exports = AssetEntity;
