const StaticObjectEntity = require('./staticObjectEntity');

class DataFileEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'DataFile';						}
	static get BUILDER()	{ return data => new DataFileEntity(data);	}
	
	constructor(fileKey) {
		super();
		this.addString('fileKey', fileKey)
			.hide();
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
	
	// Inheriting classes that add data should change this return value to true
	get hasExtraData() {
		return false;
	}
}

module.exports = DataFileEntity;
