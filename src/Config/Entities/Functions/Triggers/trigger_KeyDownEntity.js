const TriggerEntity = require('./triggerEntity');

class Trigger_KeyDownEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_KeyDown'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_KeyDownEntity(...p); 	}
	
	constructor() {
		super('Key Down');
		this.setDescription('Activates this function when any keyboard key is held down (will fire repeatedly while pressed, use cooldown if you want to limit it)');
	}
}

module.exports = Trigger_KeyDownEntity;
