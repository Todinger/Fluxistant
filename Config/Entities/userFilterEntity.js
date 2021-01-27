const Errors = requireMain('./errors');
const ChoiceEntity = require('./choiceEntity');

class UserFilterEntity extends ChoiceEntity {
	static get TYPE()		{ return 'UserFilter'; 					}
	static get BUILDER()	{ return () => new UserFilterEntity(); 	}
	
	constructor() {
		super(UserFilterEntity.TYPE);
		this._addOptions([
			'UserFilter_IsMod',
			'UserFilter_IsAtLeastMod',
			'UserFilter_IsSub',
			'UserFilter_IsUser',
			'UserFilter_IsOneOf',
		]);
	}
}

module.exports = UserFilterEntity;
