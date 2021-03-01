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
		this.addString('collection', data && data.collection || '') // Identifies the collection for functional purposes
			.hide();
		this.addString('dataType', data && data.dataType || '')
			.hide();
		this.addString('fileKey', data && data.fileKey || undefined)
			.hide();
	}
	
	getCollectionID() {
		return this.getChild('collection').getValue();
	}
	
	getDataType() {
		return this.getChild('dataType').getValue();
	}
	
	getFileKey() {
		return this.getChild('fileKey').getValue();
	}
	
	setFileKey(fileKey) {
		return this.getChild('fileKey').setValue(fileKey);
	}
	
	isSet() {
		return !!this.getFileKey();
	}
	
	clearKey() {
		this.getChild('fileKey').setValue(undefined);
	}
	
	// ---- Overrides ---- //
	
	toConf() {
		let conf = super.toConf();
		conf.fileKey = this.getFileKey();
		return conf;
	}
	
	validate() {
		super.validate();
		
		let collection = this.getCollectionID();
		Errors.ensureNonEmptyString(
			collection,
			`collection must be a non-empty string. Got: ${collection}`);
		
		let dataType = this.getDataType();
		assert(
			DataEntity.SUPPORTED_DATA_TYPES.includes(dataType),
			`Unsupported data type: ${dataType}`);
	}
}

module.exports = DataEntity;
