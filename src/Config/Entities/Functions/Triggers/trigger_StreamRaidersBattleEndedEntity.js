const TriggerEntity = require('./triggerEntity');

class Trigger_StreamRaidersBattleEndedEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_StreamRaidersBattleEnded'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_StreamRaidersBattleEndedEntity(...p); 	}
	
	constructor() {
		super('Stream Raiders Battle Ended');
		this.setDescription('Activates this function when a Stream Raiders battle ends');
	}
}

module.exports = Trigger_StreamRaidersBattleEndedEntity;
