const Trigger_StreamRaidersPurchaseBaseEntity = require('./trigger_StreamRaidersPurchaseBaseEntity');

class Trigger_StreamRaidersAnySkinPurchaseEntity extends Trigger_StreamRaidersPurchaseBaseEntity {
	static get TYPE()		{ return 'Trigger_StreamRaidersAnySkinPurchase'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_StreamRaidersAnySkinPurchaseEntity(...p); 	}
	
	constructor() {
		super('Stream Raiders Any Skin Purchase');
		this.setDescription('Activates this function when any Stream Raiders skin is purchased in any way');
	}
}

module.exports = Trigger_StreamRaidersAnySkinPurchaseEntity;
