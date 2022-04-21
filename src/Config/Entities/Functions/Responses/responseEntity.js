const ChoiceValueEntity = require('../../choiceValueEntity');

class ResponseEntity extends ChoiceValueEntity {
	static get TYPE()       { return null; }	// Avoid construction (abstract type)
	
	constructor(displayText) {
		super(displayText);
		this.addBoolean('enabled', true)
			.setName('Enabled')
			.setDescription('Enables/disables this response');
		this.addString('message')
			.setDescription('The message that will be sent by this response (variables are available - prefix a variable with an extra $ to force another evaluation pass on the message)');
	}
	
	setData(response) {
		if (response) {
			this.getChild('enabled').setValue(response.enabled);
			this.getChild('message').setValue(response.message);
		}
	}
}

module.exports = ResponseEntity;
