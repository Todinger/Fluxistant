const AssetFileEntity = require('./assetFileEntity');
const DynamicArrayEntity = require('../dynamicArrayEntity');

class ImageFileEntity extends AssetFileEntity {
	static get TYPE()		{ return 'ImageFile';					}
	static get BUILDER()	{ return () => new ImageFileEntity(); 	}
	
	constructor(fileKey) {
		super(fileKey);
		this.addNaturalNumber('width')
			.setName('Width')
			.setDescription('Display width on screen');
		this.addInteger('height')
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
	
	// ---- Overrides ---- //
	
	get hasExtraData() {
		return true;
	}
}

module.exports = ImageFileEntity;
