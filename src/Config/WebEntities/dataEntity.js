const assert = require('assert').strict;
const Errors = require('../../errors');
const StaticObjectEntity = require('./staticObjectEntity');

class DataEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Data'; 				    	}
	static get GUITYPE()	{ return 'Data'; 				    	}
	static get BUILDER()	{ return data => new DataEntity(data); 	}
	
	static get SUPPORTED_DATA_TYPES() {
		return [
			'IMAGE',
			'SOUND',
		];
	}
	
	constructor(data) {
		super();
		this.addString('colID', data && data.colID || '') // Identifies the collection for functional purposes
			.hide();
		this.addString('dataType', data && data.dataType || '')
			.hide();
		this.addBoolean('isSet', false)
			.hide();
	}
	
	getCollectionID() {
		return this.getChild('colID').getValue();
	}
	
	getDataType() {
		return this.getChild('dataType').getValue();
	}
	
	getFileKey() {
		return this.getChild('fileKey').getValue();
	}
	
	isSet() {
		return this.getChild('isSet').getValue();
	}
	
	set() {
		this.getChild('isSet').setValue(true);
	}
	
	clear() {
		this.getChild('isSet').setValue(false);
	}
	
	// ---- Overrides ---- //
	
	validate() {
		super.validate();
		
		let colID = this.getCollectionID();
		Errors.ensureNonEmptyString(
			colID,
			`colID must be a non-empty string. Got: ${colID}`);
		
		let dataType = this.getDataType();
		assert(
			DataEntity.SUPPORTED_DATA_TYPES.includes(dataType),
			`Unsupported data type: ${dataType}`);
	}
}

module.exports = DataEntity;
