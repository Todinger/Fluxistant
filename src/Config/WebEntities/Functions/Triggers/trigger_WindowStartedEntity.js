const Trigger_WindowStatusBaseEntity = require('./trigger_WindowStatusBaseEntity');

class Trigger_WindowStartedEntity extends Trigger_WindowStatusBaseEntity {
	static get TYPE()		{ return 'Trigger_WindowStarted'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_WindowStartedEntity(...p); 	}
	
	constructor(data) {
		super('Window Started', data);
		this.setDescription('Activates this function when you run a program with the selected window title');
	}
}

module.exports = Trigger_WindowStartedEntity;
