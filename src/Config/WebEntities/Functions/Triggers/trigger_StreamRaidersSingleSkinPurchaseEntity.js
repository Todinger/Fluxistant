const Trigger_StreamRaidersPurchaseBaseEntity = require("./trigger_StreamRaidersPurchaseBaseEntity");

class Trigger_StreamRaidersSingleSkinPurchaseEntity extends Trigger_StreamRaidersPurchaseBaseEntity {
	static get TYPE()		{ return 'Trigger_StreamRaidersSingleSkinPurchase'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_StreamRaidersSingleSkinPurchaseEntity(...p); 	}
	
	constructor() {
		super('Stream Raiders Single Skin Purchase', [
			"skinIsFlag",
			"skinIsHead",
			"skinIsFull",
			"skinIsEpic",
			"skinIsHolo",
			"skinIsVariant",
			"skinIsGold",
			"skinIsDiamond",
		]);
		this.setDescription('Activates this function when someone purchases a Stream Raiders skin for themselves');
	}
}

module.exports = Trigger_StreamRaidersSingleSkinPurchaseEntity;
