const StaticObjectEntity = require('./staticObjectEntity');

class CooldownEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Cooldown'; 					}
	static get BUILDER()	{ return () => new CooldownEntity(); 	}
	
	constructor() {
		super();
		this.addNonNegativeNumber('user')
			.setDescription('Time in seconds before the same user can use the command');
		this.addNonNegativeNumber('global')
			.setDescription('Time in seconds before the command can be used again at all');
	}
	
	getUser() {
		return this.getChild('user').getValue();
	}
	
	getGlobal() {
		return this.getChild('global').getValue();
	}
	
	setUser(value) {
		return this.getChild('user').setValue(value);
	}
	
	setGlobal(value) {
		return this.getChild('global').setValue(value);
	}
	
	set(data) {
		if (data.user) {
			this.setUser(data.user);
		}
		
		if (data.global) {
			this.setGlobal(data.global);
		}
	}
}

module.exports = CooldownEntity;
