const _ = require('lodash');
const StaticObjectEntity = requireConfig('staticObjectEntity');
const DynamicArrayEntity = requireConfig('dynamicArrayEntity');

class ImageEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Image'; 					}
	static get BUILDER()	{ return () => new ImageEntity(); 	}
	
	static makeDisplayData(imageFileEntityConf, savedFile) {
		let dd = _.omit(imageFileEntityConf, 'file');
		dd.url = savedFile.data;
		return dd;
	}
	
	constructor() {
		super();
		this.addSingleData('file', { collection: 'Images', dataType: 'IMAGE' })
			.setName('Image')
			.setDescription('The image that will be displayed on the screen');
		this.addNaturalNumber('width')
			.setName('Width')
			.setDescription('Display width on screen');
		this.addNaturalNumber('height')
			.setName('Height')
			.setDescription('Display height on screen');
		this.addNaturalNumber('duration')
			.setName('Duration')
			.setDescription('Duration in milliseconds that the image will be displayed');
		this.addChild('effects', new DynamicArrayEntity('ImageEffect'))
			.setName('Effects')
			.setDescription('Special effects to apply to the image');
	}
	
	getFile() {
		return this.getChild('file');
	}

	isSet() {
		return this.getFile().isSet();
	}
	
	toConf() {
		let conf = super.toConf();
		conf.makeDisplayData = function(savedFile) {
			return ImageEntity.makeDisplayData(this, savedFile);
		};
		return conf;
	}
}

module.exports = ImageEntity;
