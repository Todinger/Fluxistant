const NamedEntity = require('./namedEntity');

class UserEntity extends NamedEntity {
	static get TYPE()		{ return 'User'; 					}
	static get BUILDER()	{ return () => new UserEntity(); 	}
	
	constructor() {
		super();
		this.addString('username')
			.setName('Username')
			.setDescription('Twitch username this configuration is for');
	}
	
	getUsername() {
		return this.getChild('username').getValue();
	}
	
	getNameOverride() {
		return this.getUsername();
	}
}

module.exports = UserEntity;
