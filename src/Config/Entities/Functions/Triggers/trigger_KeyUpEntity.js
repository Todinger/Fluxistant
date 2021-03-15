const TriggerEntity = require('./triggerEntity');

class Trigger_KeyUpEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_KeyUp'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_KeyUpEntity(...p); 	}
	
	constructor() {
		super('Key Up');
		this.setDescription('Activates this function when any keyboard key is released');
	}
}

module.exports = Trigger_KeyUpEntity;
