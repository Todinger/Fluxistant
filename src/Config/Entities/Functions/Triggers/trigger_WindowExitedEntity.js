const Trigger_WindowStatusBaseEntity = require('./trigger_WindowStatusBaseEntity');

class Trigger_WindowExitedEntity extends Trigger_WindowStatusBaseEntity {
	static get TYPE()		{ return 'Trigger_WindowExited'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_WindowExitedEntity(...p); 	}
	
	constructor(data) {
		super('Window Exited', data);
		this.setDescription('Activates this function when you exit a program with the selected window title');
	}
}

module.exports = Trigger_WindowExitedEntity;
