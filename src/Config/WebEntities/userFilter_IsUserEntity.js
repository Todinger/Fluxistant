const Errors = require('../../errors');
const UserFilter_BaseEntity = require('./userFilter_BaseEntity');
const StringEntity = require('./stringEntity');

class UserFilter_IsUserEntity extends UserFilter_BaseEntity {
	static get TYPE()		{ return 'UserFilter_IsUser'; 					}
	static get BUILDER()	{ return () => new UserFilter_IsUserEntity(); 	}
	
	constructor() {
		super(UserFilter_IsUserEntity.TYPE, 'Specific User');
		this.addChild('argument', new StringEntity(''))
			.setName('Username')
			.setDescription('Only this user will be able to invoke the command.');
	}
	
	setData(data) {
		if (data && data.argument) {
			this.getChild('argument').setValue(data.argument);
		}
	}
}

module.exports = UserFilter_IsUserEntity;
