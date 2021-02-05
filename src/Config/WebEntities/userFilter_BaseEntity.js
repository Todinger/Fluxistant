const ChoiceValueEntity = require('./choiceValueEntity');

class UserFilter_BaseEntity extends ChoiceValueEntity {
	constructor(type, displayText) {
		super(type, displayText);
	}
	
	// Used by some concrete user filter entities
	setData(data) {
	}
}

module.exports = UserFilter_BaseEntity;
