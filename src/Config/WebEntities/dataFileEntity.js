const StaticObjectEntity = require('./staticObjectEntity');

class DataFileEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'DataFile';						}
	static get GUITYPE()	{ return 'RawObject';						}
	static get BUILDER()	{ return data => new DataFileEntity(data);	}
	
	static makeDisplayData(soundFileEntityConf, savedFile) {
		let dd = _.omit(soundFileEntityConf, 'fileKey');
		dd.url = savedFile.data;
		return dd;
	}
	
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
	
	toConf() {
		let conf = super.toConf();
		conf.makeDisplayData = function(savedFile) {
			return DataFileEntity.makeDisplayData(this, savedFile);
		};
		return conf;
	}
}

module.exports = DataFileEntity;
