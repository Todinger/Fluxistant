const ChoiceValueEntity = require('./choiceValueEntity');
const IntegerEntity = require('./integerEntity');

class ImageEffect_ShadowEntity extends ChoiceValueEntity {
	static get TYPE()		{ return 'ImageEffect_Shadow'; 					}
	static get BUILDER()	{ return () => new ImageEffect_ShadowEntity(); 	}
	
	constructor() {
		super(ImageEffect_ShadowEntity.TYPE);
		this.addChild('size', new IntegerEntity())
			.setDescription("Spread of the shadow effect (warning: doesn't work that well).");
	}
}

module.exports = ImageEffect_ShadowEntity;
