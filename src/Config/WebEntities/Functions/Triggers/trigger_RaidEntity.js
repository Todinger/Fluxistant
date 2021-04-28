const TriggerEntity = require('./triggerEntity');

class Trigger_RaidEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_Raid'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_RaidEntity(...p); 	}
	
	constructor() {
		super('Raid');
		this.setDescription('Activates this function when someone hosts the channel on Twitch');
	}
}

module.exports = Trigger_RaidEntity;
