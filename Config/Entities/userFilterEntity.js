const Errors = requireMain('./errors');
const ChoiceEntity = require('./choiceEntity');

class UserFilterEntity extends ChoiceEntity {
	static get TYPE()		{ return 'UserFilter'; 					}
	static get BUILDER()	{ return () => new UserFilterEntity(); 	}
	
	constructor() {
		super(UserFilterEntity.TYPE);
		this._addOptions({
			["isMod"]:          'UserFilter_IsMod',
			["isAtLeastMod"]:   'UserFilter_IsAtLeastMod',
			["isSub"]:          'UserFilter_IsSub',
			["isUser"]:         'UserFilter_IsUser',
			["isOneOf"]:        'UserFilter_IsOneOf',
		});
	}
}

module.exports = UserFilterEntity;
