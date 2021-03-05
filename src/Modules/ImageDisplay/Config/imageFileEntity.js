const _ = require('lodash');
const DataFileEntity = requireConfig('dataFileEntity');
const DynamicArrayEntity = requireConfig('dynamicArrayEntity');

class ImageFileEntity extends DataFileEntity {
	static get TYPE()		{ return 'ImageFile';					}
	static get BUILDER()	{ return () => new ImageFileEntity(); 	}
	
	static makeDisplayData(imageFileEntityConf, savedFile) {
		let dd = _.omit(imageFileEntityConf, 'fileKey');
		dd.url = savedFile.data;
		return dd;
	}
	
	constructor(fileKey) {
		super(fileKey);
		this.addNaturalNumber('width')
			.setName('Width')
			.setDescription('Display width on screen');
		this.addInteger('height')
			.setName('Height')
			.setDescription('Display height on screen');
		this.addNaturalNumber('duration')
			.setName('Duration')
			.setDescription('Duration in milliseconds that the image will be displayed');
		this.addChild('effects', new DynamicArrayEntity('ImageEffect'))
			.setName('Effects')
			.setDescription('Special effects to apply to the image');
	}
	
	// ---- Overrides ---- //
	
	get hasExtraData() {
		return true;
	}
	
	toConf() {
		let conf = super.toConf();
		conf.makeDisplayData = function(savedFile) {
			return ImageFileEntity.makeDisplayData(conf, savedFile);
		};
		return conf;
	}
}

module.exports = ImageFileEntity;
