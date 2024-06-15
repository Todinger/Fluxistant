const TriggerEntity = require('./triggerEntity');

class Trigger_StreamRaidersMultiSkinBombEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_StreamRaidersMultiSkinBomb'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_StreamRaidersMultiSkinBombEntity(...p); 	}
	
	constructor() {
		super('Stream Raiders Skin Bomb');
		this.setDescription('Activates this function when someone buys a Stream Raiders skin pack of any amount');
	}
}

module.exports = Trigger_StreamRaidersMultiSkinBombEntity;
