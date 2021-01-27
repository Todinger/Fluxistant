const UserFilter_BaseEntity = require('./userFilter_BaseEntity');
const ArrayEntity = require('./arrayEntity');
const ValueEntity = require('./valueEntity');

class UserFilter_IsOneOfEntity extends UserFilter_BaseEntity {
	static get TYPE()		{ return 'UserFilter_IsOneOf'; 					}
	static get BUILDER()	{ return () => new UserFilter_IsOneOfEntity(); 	}
	
	constructor() {
		super(UserFilter_IsOneOfEntity.TYPE);
		this.addChild('argument', new ArrayEntity('Value'))
			.setName('Usernames')
			.setDescription('Only this user will be able to invoke the command.');
	}
	
	setData(data) {
		if (data && data.argument) {
			let usernames = this.getChild('argument');
			data.argument.forEach(username => {
				usernames.addElement(new ValueEntity(username));
			});
		}
	}
}

module.exports = UserFilter_IsOneOfEntity;
