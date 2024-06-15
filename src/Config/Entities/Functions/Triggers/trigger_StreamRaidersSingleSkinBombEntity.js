const Trigger_StreamRaidersPurchaseBaseEntity = require("./trigger_StreamRaidersPurchaseBaseEntity");

class Trigger_StreamRaidersSingleSkinBombEntity extends Trigger_StreamRaidersPurchaseBaseEntity {
	static get TYPE()		{ return 'Trigger_StreamRaidersSingleSkinBomb'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_StreamRaidersSingleSkinBombEntity(...p); 	}
	
	constructor() {
		super('Stream Raiders Single-Skin Bomb', [
			"skinIsEpic",
			"skinIsHolo",
			"skinIsVariant",
			"skinIsGold",
			"skinIsDiamond",
		]);
		this.setDescription('Activates this function when someone buys a Stream Raiders skin pack with a single skin');
	}
}

module.exports = Trigger_StreamRaidersSingleSkinBombEntity;
