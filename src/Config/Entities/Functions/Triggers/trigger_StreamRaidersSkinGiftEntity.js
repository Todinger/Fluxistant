const TriggerEntity = require('./triggerEntity');

class Trigger_StreamRaidersSkinGiftEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_StreamRaidersSkinGift'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_StreamRaidersSkinGiftEntity(...p); 	}
	
	constructor() {
		super('Stream Raiders Skin Gift');
		this.setDescription('Activates this function when someone gifts a Stream Raiders skin directly');
	}
}

module.exports = Trigger_StreamRaidersSkinGiftEntity;
