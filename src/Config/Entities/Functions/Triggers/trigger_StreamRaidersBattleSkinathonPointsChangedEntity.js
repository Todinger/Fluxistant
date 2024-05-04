const TriggerEntity = require('./triggerEntity');

class Trigger_StreamRaidersSkinathonPointsChangedEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_StreamRaidersSkinathonPointsChanged'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_StreamRaidersSkinathonPointsChangedEntity(...p); 	}
	
	constructor() {
		super('Stream Raiders Skinathon Points Changed');
		this.setDescription('Activates this function when the number of SP in a Stream Raiders skinathon changes');
	}
}

module.exports = Trigger_StreamRaidersSkinathonPointsChangedEntity;
