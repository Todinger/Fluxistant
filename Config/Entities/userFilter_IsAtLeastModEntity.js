const UserFilter_BaseEntity = require('./userFilter_BaseEntity');

class UserFilter_IsAtLeastModEntity extends UserFilter_BaseEntity {
	static get TYPE()		{ return 'UserFilter_IsAtLeastMod'; 					}
	static get BUILDER()	{ return () => new UserFilter_IsAtLeastModEntity(); 	}
	
	constructor() {
		super(UserFilter_IsAtLeastModEntity.TYPE);
	}
}

module.exports = UserFilter_IsAtLeastModEntity;