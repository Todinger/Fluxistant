const ChoiceValueEntity = require('./choiceValueEntity');
const ValueEntity = require('./ValueEntity');

class ImageEffect_GlowEntity extends ChoiceValueEntity {
	static get TYPE()		{ return 'ImageEffect_Glow'; 					}
	static get BUILDER()	{ return () => new ImageEffect_GlowEntity(); 	}
	
	constructor() {
		super(ImageEffect_GlowEntity.TYPE);
		this.addChild('size', new ValueEntity())
			.setDescription("Spread of the glow effect (warning: doesn't work that well).");
	}
}

module.exports = ImageEffect_GlowEntity;
