const TriggerEntity = require('./triggerEntity');

class Trigger_StreamRaidersBattleStartedEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_StreamRaidersBattleStarted'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_StreamRaidersBattleStartedEntity(...p); 	}
	
	constructor() {
		super('Stream Raiders Battle Started');
		this.setDescription('Activates this function when a Stream Raiders battle starts');
	}
}

module.exports = Trigger_StreamRaidersBattleStartedEntity;
