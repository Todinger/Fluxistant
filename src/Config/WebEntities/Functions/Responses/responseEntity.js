const ChoiceValueEntity = require('../../choiceValueEntity');

class ResponseEntity extends ChoiceValueEntity {
	static get TYPE()       { return null; }	// Avoid construction (abstract type)
	
	constructor(displayText) {
		super(displayText);
		this.addBoolean('enabled', true)
			.setName('Enabled')
			.setDescription('Enables/disables this response');
	}
	
	setData(response) {
		if (response) {
			this.getChild('enabled').setValue(response.enabled);
		}
	}
}

module.exports = ResponseEntity;
