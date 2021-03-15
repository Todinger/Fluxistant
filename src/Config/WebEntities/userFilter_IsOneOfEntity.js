const UserFilter_BaseEntity = require('./userFilter_BaseEntity');
const DynamicArrayEntity = require('./dynamicArrayEntity');
const StringEntity = require('./Values/stringEntity');

class UserFilter_IsOneOfEntity extends UserFilter_BaseEntity {
	static get TYPE()		{ return 'UserFilter_IsOneOf'; 					}
	static get BUILDER()	{ return () => new UserFilter_IsOneOfEntity(); 	}
	
	constructor() {
		super('Specific Users');
		this.setDescription('Allows only a specific group of users to invoke the command');
		this.addChild('argument', new DynamicArrayEntity('String'))
			.setName('Usernames')
			.setDescription('Only this user will be able to invoke the command');
	}
	
	setData(data) {
		if (data && data.argument) {
			let usernames = this.getChild('argument');
			data.argument.forEach(username => {
				usernames.addElement(new StringEntity(username));
			});
		}
	}
}

module.exports = UserFilter_IsOneOfEntity;
