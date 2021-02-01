const ChoiceEntity = require('./choiceEntity');

class ImageEffectEntity extends ChoiceEntity {
	static get TYPE()		{ return 'ImageEffect'; 					}
	static get BUILDER()	{ return () => new ImageEffectEntity(); 	}
	
	constructor() {
		super(ImageEffectEntity.TYPE);
		this._addOptions({
			["glow"]:       'ImageEffect_Glow',
			["shadow"]:     'ImageEffect_Shadow',
			["dundundun"]:  'ImageEffect_DunDunDun',
		});
	}
}

module.exports = ImageEffectEntity;
