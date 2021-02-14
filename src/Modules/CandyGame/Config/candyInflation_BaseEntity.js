const ChoiceValueEntity = requireConfig('choiceValueEntity');

class CandyInflation_BaseEntity extends ChoiceValueEntity {
	constructor(displayText) {
		super(displayText);
	}
	
	// Used by some concrete entities
	setData(data) {
	}
}

module.exports = CandyInflation_BaseEntity;
