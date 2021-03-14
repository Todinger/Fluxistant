const ChoiceValueEntity = require('./choiceValueEntity');

class ResponseEntity extends ChoiceValueEntity {
	static get TYPE()       { return null; }	// Avoid construction (abstract type)
	
	constructor(displayText) {
		super(displayText);
		this.addBoolean('active')
			.setName('Enabled')
			.setDescription('Enables/disables this response');
		this.addString('message')
			.setDescription('The message that will be sent by this response (variables are available)');
	}
	
	setData(data) {
		if (data) {
			this.getChild('message').setValue(data.message);
		}
	}
}

module.exports = ResponseEntity;
