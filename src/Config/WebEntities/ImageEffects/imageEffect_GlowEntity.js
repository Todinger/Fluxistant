const ChoiceValueEntity = require('../choiceValueEntity');

class ImageEffect_GlowEntity extends ChoiceValueEntity {
	static get TYPE()		{ return 'ImageEffect_Glow'; 					}
	static get BUILDER()	{ return () => new ImageEffect_GlowEntity(); 	}
	
	constructor() {
		super('Glow');
		this.setDescription('Adds an outer glow to the image');
		
		this.addInteger('size')
			.setName('Size')
			.setDescription("Spread of the glow effect (warning - doesn't work that well)");
	}
}

module.exports = ImageEffect_GlowEntity;
