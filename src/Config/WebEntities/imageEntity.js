const StaticObjectEntity = require('./staticObjectEntity');
const DynamicArrayEntity = require('./dynamicArrayEntity');

class ImageEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Image'; 					}
	static get BUILDER()	{ return () => new ImageEntity(); 	}
	
	constructor() {
		super();
		this.addString('filename')
			.setName('File Name')
			.setDescription('The name of the image file that will be displayed');
		this.addInteger('width')
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
	
	isSet() {
		return this.getChild('filename').isSet();
	}
}

module.exports = ImageEntity;
