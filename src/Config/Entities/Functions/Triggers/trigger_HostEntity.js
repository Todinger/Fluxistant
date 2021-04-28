const TriggerEntity = require('./triggerEntity');

class Trigger_HostEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_Host'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_HostEntity(...p); 	}
	
	constructor() {
		super('Host');
		this.setDescription('Activates this function when someone hosts the channel on Twitch');
	}
}

module.exports = Trigger_HostEntity;
