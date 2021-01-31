const UserFilter_BaseEntity = require('./userFilter_BaseEntity');

class UserFilter_IsSubEntity extends UserFilter_BaseEntity {
	static get TYPE()		{ return 'UserFilter_IsSub'; 					}
	static get BUILDER()	{ return () => new UserFilter_IsSubEntity(); 	}
	
	constructor() {
		super(UserFilter_IsSubEntity.TYPE);
	}
}

module.exports = UserFilter_IsSubEntity;
