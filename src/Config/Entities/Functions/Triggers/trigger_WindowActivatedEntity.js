const Trigger_WindowStatusBaseEntity = require('./trigger_WindowStatusBaseEntity');

class Trigger_WindowActivatedEntity extends Trigger_WindowStatusBaseEntity {
	static get TYPE()		{ return 'Trigger_WindowActivated'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_WindowActivatedEntity(...p); 	}
	
	constructor(data) {
		super('Window Activated', data);
		this.setDescription('Activates this function when you switch to the selected window');
	}
}

module.exports = Trigger_WindowActivatedEntity;
