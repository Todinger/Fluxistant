const UserFilter_BaseEntity = require('./userFilter_BaseEntity');

class UserFilter_IsModEntity extends UserFilter_BaseEntity {
	static get TYPE()		{ return 'UserFilter_IsMod'; 					}
	static get BUILDER()	{ return () => new UserFilter_IsModEntity(); 	}
	
	constructor() {
		super(UserFilter_IsModEntity.TYPE, 'Mods Only');
	}
}

module.exports = UserFilter_IsModEntity;
