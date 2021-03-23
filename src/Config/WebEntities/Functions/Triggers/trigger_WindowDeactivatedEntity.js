const Trigger_WindowStatusBaseEntity = require('./trigger_WindowStatusBaseEntity');

class Trigger_WindowDeactivatedEntity extends Trigger_WindowStatusBaseEntity {
	static get TYPE()		{ return 'Trigger_WindowDeactivated'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_WindowDeactivatedEntity(...p); 	}
	
	constructor(data) {
		super('Window Deactivated', data);
		this.setDescription('Activates this function when you switch out of the selected window');
	}
}

module.exports = Trigger_WindowDeactivatedEntity;
