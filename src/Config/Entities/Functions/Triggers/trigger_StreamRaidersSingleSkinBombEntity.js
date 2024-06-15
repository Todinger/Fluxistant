const TriggerEntity = require('./triggerEntity');

class Trigger_StreamRaidersSingleSkinBombEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_StreamRaidersSingleSkinBomb'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_StreamRaidersSingleSkinBombEntity(...p); 	}
	
	constructor() {
		super('Stream Raiders Single-Skin Bomb');
		this.setDescription('Activates this function when someone buys a Stream Raiders skin pack with a single skin');
	}
}

module.exports = Trigger_StreamRaidersSingleSkinBombEntity;
