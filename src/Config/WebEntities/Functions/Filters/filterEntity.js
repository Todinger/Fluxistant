const ChoiceValueEntity = require('../../choiceValueEntity');

class FilterEntity extends ChoiceValueEntity {
	static get TYPE()       { return null; }	// Avoid construction (abstract type)
	
	constructor(displayText) {
		super(displayText);
	}
	
	setData(data) {
		// For deriving classes
	}
}

module.exports = FilterEntity;
