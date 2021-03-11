const AssetEntity = require('./assetEntity');

class SingleAssetEntity extends AssetEntity {
	static get TYPE()		{ return 'SingleData'; 							}
	static get GUITYPE()	{ return 'SingleData'; 							}
	static get BUILDER()	{ return data => new SingleAssetEntity(data); 	}
	
	constructor(data) {
		super(data);
		this.addString('fileKey', data && data.fileKey || undefined)
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
	
	// ---- Overrides ---- //
	
	toConf() {
		let conf = super.toConf();
		conf.fileKey = this.getFileKey();
		return conf;
	}
}

module.exports = SingleAssetEntity;
