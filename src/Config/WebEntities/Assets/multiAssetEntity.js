const AssetEntity = require('./assetEntity');

class MultiAssetEntity extends AssetEntity {
	static get TYPE()		{ return 'MultiAsset'; 							}
	static get GUITYPE()	{ return 'MultiAsset'; 							}
	static get BUILDER()	{ return data => new MultiAssetEntity(data); 	}
	
	constructor(data) {
		super(data);
		this.addDynamicArray('files', data && data.elementValueType) // THE TYPE MUST INHERIT FROM DataFileEntity!
			.hide();
	}
	
	getFiles() {
		return this.getChild('files');
	}
	
	forEachFile(func) {
		this.getFiles().forEach(func);
	}
	
	getFileKeys() {
		return this.getFiles().map(entity => entity.getFileKey());
	}
	
	getFileKey(index) {
		return this.getFiles().getElement(index).getFileKey();
	}
	
	setFileKey(index, fileKey) {
		this.getFiles().getElement(index).setFileKey(fileKey);
	}
	
	getFileElementByKey(fileKey) {
		let fittingElements = this.getChild('files').getElements().filter(
			fileEntity => fileEntity.getFileKey() === fileKey);
		return fittingElements.length > 0 ? fittingElements[0] : undefined;
	}
	
	createAndAddFile(fileKey, fileName) {
		let newFile = this.getFiles().createAndAddElement();
		newFile.setFileKey(fileKey);
		newFile.setFileName(fileName);
		return newFile;
	}
	
	removeFile(fileKey) {
		let filesArray = this.getChild('files');
		let files = filesArray.getElements();
		for (let i = 0; i < files.length; i++) {
			if (files[i].getFileKey() === fileKey) {
				filesArray.removeElementAt(i);
				return;
			}
		}
	}
	
	isEmpty() {
		return this.getFiles().length === 0;
	}
	
	// ---- Overrides ---- //
	
	toConf() {
		let conf = super.toConf();
		let keyedFiles = {};
		conf.files.forEach(file => {
			file.collection = this.getCollectionID();
			keyedFiles[file.fileKey] = file;
		});
		
		delete conf.files;
		conf.files = keyedFiles;
		return conf;
	}
}

module.exports = MultiAssetEntity;
