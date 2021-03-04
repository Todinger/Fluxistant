const DataEntity = require('./dataEntity');

class MultiDataEntity extends DataEntity {
	static get TYPE()		{ return 'MultiData'; 							}
	static get GUITYPE()	{ return 'MultiData'; 							}
	static get BUILDER()	{ return data => new MultiDataEntity(data); 	}
	
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
	
	createAndAddFile(fileKey) {
		let newFile = this.getFiles().createAndAddElement();
		newFile.setFileKey(fileKey);
		return newFile;
	}
	
	isEmpty() {
		return this.getFiles().length === 0;
	}
	
	// ---- Overrides ---- //
	
	toConf() {
		let conf = super.toConf();
		let keyedFiles = {};
		conf.files.forEach(file => {
			keyedFiles[file.fileKey] = file;
		});
		
		delete conf.files;
		conf.files = keyedFiles;
		return conf;
	}
}

module.exports = MultiDataEntity;
