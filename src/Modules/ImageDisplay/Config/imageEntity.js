const _ = require('lodash');
const StaticObjectEntity = requireConfig('staticObjectEntity');
const DynamicArrayEntity = requireConfig('dynamicArrayEntity');

class ImageEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Image'; 					}
	static get BUILDER()	{ return () => new ImageEntity(); 	}
	
	static makeDisplayData(imageFileEntityConf, savedFile) {
		let dd = _.omit(imageFileEntityConf, 'file');
		dd.url = savedFile.data;
		if (dd.duration) {
			dd.duration *= 1000; // Milliseconds to seconds
		}
		
		return dd;
	}
	
	constructor() {
		super();
		this.addSingleAsset('file', { collection: 'Images', dataType: 'IMAGE' })
			.setName('Image')
			.setDescription('The image that will be displayed on the screen');
		this.addNaturalNumber('width')
			.setName('Width')
			.setDescription('Display width on screen');
		this.addNaturalNumber('height')
			.setName('Height')
			.setDescription('Display height on screen');
		this.addNonNegativeNumber('duration')
			.setName('Duration')
			.setDescription('Duration in seconds that the image will be displayed')
			.setAdvanced();
		this.addChild('effects', new DynamicArrayEntity('ImageEffect'))
			.setName('Effects')
			.setDescription('Special effects to apply to the image')
			.setAdvanced();
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
