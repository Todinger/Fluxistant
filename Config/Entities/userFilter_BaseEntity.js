const ChoiceValueEntity = require('./choiceValueEntity');

class UserFilter_BaseEntity extends ChoiceValueEntity {
	constructor(type) {
		super(type);
	}
	
	// Used by some concrete user filter entities
	setData(data) {
	}
}

module.exports = UserFilter_BaseEntity;
