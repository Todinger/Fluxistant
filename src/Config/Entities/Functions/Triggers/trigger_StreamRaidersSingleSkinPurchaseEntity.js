const TriggerEntity = require('./triggerEntity');

class Trigger_StreamRaidersSingleSkinPurchaseEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_StreamRaidersSingleSkinPurchase'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_StreamRaidersSingleSkinPurchaseEntity(...p); 	}
	
	constructor() {
		super('Stream Raiders Single Skin Purchase');
		this.setDescription('Activates this function when someone purchases a Stream Raiders skin for themselves');
	}
}

module.exports = Trigger_StreamRaidersSingleSkinPurchaseEntity;
