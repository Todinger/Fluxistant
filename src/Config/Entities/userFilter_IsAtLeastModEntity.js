const UserFilter_BaseEntity = require('./userFilter_BaseEntity');

class UserFilter_IsAtLeastModEntity extends UserFilter_BaseEntity {
	static get TYPE()		{ return 'UserFilter_IsAtLeastMod'; 					}
	static get BUILDER()	{ return () => new UserFilter_IsAtLeastModEntity(); 	}
	
	constructor() {
		super(UserFilter_IsAtLeastModEntity.TYPE, 'Mods and Streamer Only');
		this.setDescription('Allows only mods and the streamer to invoke the command');
	}
}

module.exports = UserFilter_IsAtLeastModEntity;
