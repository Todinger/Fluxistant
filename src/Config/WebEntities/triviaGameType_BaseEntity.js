const ChoiceValueEntity = require('././choiceValueEntity');

class TriviaGameType_BaseEntity extends ChoiceValueEntity {
	constructor(displayText) {
		super(displayText);
	}
	
	// Used by some concrete user filter entities
	setData(data) {
	}
}

module.exports = TriviaGameType_BaseEntity;
