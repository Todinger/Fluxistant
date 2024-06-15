const Trigger_StreamRaidersPurchaseBaseEntity = require("./trigger_StreamRaidersPurchaseBaseEntity");

class Trigger_StreamRaidersSkinGiftEntity extends Trigger_StreamRaidersPurchaseBaseEntity {
	static get TYPE()		{ return 'Trigger_StreamRaidersSkinGift'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_StreamRaidersSkinGiftEntity(...p); 	}
	
	constructor() {
		super('Stream Raiders Skin Gift');
		this.setDescription('Activates this function when someone gifts a Stream Raiders skin directly');
	}
}

module.exports = Trigger_StreamRaidersSkinGiftEntity;
