const Errors = require('../../errors');
const UserFilter_BaseEntity = require('./userFilter_BaseEntity');
const ValueEntity = require('./valueEntity');

class UserFilter_IsUserEntity extends UserFilter_BaseEntity {
	static get TYPE()		{ return 'UserFilter_IsUser'; 					}
	static get BUILDER()	{ return () => new UserFilter_IsUserEntity(); 	}
	
	constructor() {
		super(UserFilter_IsUserEntity.TYPE);
		this.addChild('argument', new ValueEntity(''))
			.setName('Username')
			.setDescription('Only this user will be able to invoke the command.');
	}
	
	validate() {
		Errors.ensureNonEmptyString(this.getChild('argument').getValue());
	}
	
	setData(data) {
		if (data && data.argument) {
			this.getChild('argument').setValue(data.argument);
		}
	}
}

module.exports = UserFilter_IsUserEntity;
