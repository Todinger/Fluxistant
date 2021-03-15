const ChoiceValueEntity = require('../choiceValueEntity');

class ImageEffect_ShadowEntity extends ChoiceValueEntity {
	static get TYPE()		{ return 'ImageEffect_Shadow'; 					}
	static get BUILDER()	{ return () => new ImageEffect_ShadowEntity(); 	}
	
	constructor() {
		super('Shadow');
		this.setDescription('Adds an outer shadow to the image');
		
		this.addInteger('size')
			.setName('Size')
			.setDescription("Spread of the shadow effect (warning - doesn't work that well).");
	}
}

module.exports = ImageEffect_ShadowEntity;
