const StaticObjectEntity = require('./staticObjectEntity');

function isNonEmptyString(obj) {
	return (typeof obj == 'string') && (obj.length > 0);
}

class UserEntity extends StaticObjectEntity {
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
	
	// ---- Overrides ---- //
	
	getDisplayName() {
		let name = super.getName();
		let displayName = super.getDisplayName();
		let userName = this.getUsername();
		
		return (isNonEmptyString(name) && name) ||
			(isNonEmptyString(userName) && userName) ||
			(isNonEmptyString(displayName) && displayName) ||
			undefined;
	}
}

module.exports = UserEntity;
