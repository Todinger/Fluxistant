const TriggerEntity = require('./triggerEntity');

class Trigger_StreamRaidersAnySkinPurchaseEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_StreamRaidersAnySkinPurchase'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_StreamRaidersAnySkinPurchaseEntity(...p); 	}
	
	constructor() {
		super('Stream Raiders Any Skin Purchase');
		this.setDescription('Activates this function when any Stream Raiders skin is purchased in any way');
	}
}

module.exports = Trigger_StreamRaidersAnySkinPurchaseEntity;
