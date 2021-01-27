const ObjectEntity = requireConfig('objectEntity');
const ValueEntity = requireConfig('valueEntity');
const ArrayEntity = requireConfig('arrayEntity');

class ImageEntity extends ObjectEntity {
	static get TYPE()		{ return 'Image'; 					}
	static get BUILDER()	{ return () => new ImageEntity(); 	}
	
	constructor() {
		super(ImageEntity.TYPE);
		this.addChild('filename', new ValueEntity())
			.setDescription('The name of the image file that will be displayed.');
		this.addChild('width', new ValueEntity())
			.setDescription('Display width on screen.');
		this.addChild('height', new ValueEntity())
			.setDescription('Display height on screen.');
		this.addChild('duration', new ValueEntity())
			.setDescription('Display height on screen.');
		this.addChild('effects', new ArrayEntity('ImageEffect'))
			.setDescription('Special effects to apply to the image.');
	}
	
	isSet() {
		return this.getChild('filename').isSet();
	}
}

module.exports = ImageEntity;
