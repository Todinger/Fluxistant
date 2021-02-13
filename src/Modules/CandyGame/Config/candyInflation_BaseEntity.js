const ChoiceValueEntity = requireConfig('choiceValueEntity');

class CandyInflation_BaseEntity extends ChoiceValueEntity {
	constructor(type, displayText) {
		super(type, displayText);
	}
	
	// Used by some concrete entities
	setData(data) {
	}
}

module.exports = CandyInflation_BaseEntity;
