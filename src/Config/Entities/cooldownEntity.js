const assert = require('assert').strict;
const StaticObjectEntity = require('./staticObjectEntity');
const IntegerEntity = require('./integerEntity');

class CooldownEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Cooldown'; 					}
	static get BUILDER()	{ return () => new CooldownEntity(); 	}
	
	constructor() {
		super(CooldownEntity.TYPE);
		this.addChild('user', new IntegerEntity())
			.setDescription('Time in milliseconds before the same user can use the command.');
		this.addChild('global', new IntegerEntity())
			.setDescription('Time in milliseconds before the command can be used again at all.');
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
	
	
	// ---- Overrides ---- //
	
	validate() {
		let userCD = this.getUser();
		let globalCD = this.getGlobal();
		
		if (userCD) {
			assert(userCD >= 0);
		}
		
		if (globalCD) {
			assert(globalCD >= 0);
		}
	}
}

module.exports = CooldownEntity;
