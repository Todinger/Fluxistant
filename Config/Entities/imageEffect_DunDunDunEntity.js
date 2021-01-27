const ChoiceValueEntity = require('./choiceValueEntity');

class ImageEffect_DunDunDunEntity extends ChoiceValueEntity {
	static get TYPE()		{ return 'ImageEffect_DunDunDun'; 					}
	static get BUILDER()	{ return () => new ImageEffect_DunDunDunEntity(); 	}
	
	constructor() {
		super(ImageEffect_DunDunDunEntity.TYPE);
		
		this.addChild('durationSmall', new ValueEntity())
			.setName('Small Size Duration')
			.setDescription('The amount of time that the image will remain in its smallest size. Should match the pause between the first and second "dun"s of the sound effect.');
		this.addChild('durationMedium', new ValueEntity())
			.setName('Medium Size Duration')
			.setDescription('The amount of time that the image will remain in its middle size. Should match the pause between the second and third "dun"s of the sound effect.');
		this.addChild('durationLarge', new ValueEntity())
			.setName('Large Size Duration')
			.setDescription('The amount of time that the image will remain in its full size (shaking). Should match the length of the third "dun" in the sound effect.');
		
		this.addChild('sizeSmall', new ValueEntity())
			.setName('Small Size (Width)')
			.setDescription('The width the image should have in its small form. The height will scale to match.');
		this.addChild('sizeSmall', new ValueEntity())
			.setName('Medium Size (Width)')
			.setDescription('The width the image should have in its middle form. The height will scale to match.');
		this.addChild('sizeSmall', new ValueEntity())
			.setName('Large Size (Width)')
			.setDescription('The width the image should have in its final form. The height will scale to match.');
	}
}

module.exports = ImageEffect_DunDunDunEntity;
