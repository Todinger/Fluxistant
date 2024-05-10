const ResponseEntity = require('./responseEntity');

class SingleResponseEntity extends ResponseEntity {
	static get TYPE()       { return null; }	// Avoid construction (abstract type)
	
	constructor(displayText) {
		super(displayText);
		this.addString('message')
			.setDescription('The message that will be sent by this response (variables are available - prefix a variable with an extra $ to force another evaluation pass on the message)');
	}
	
	setData(response) {
		if (response) {
			this.getChild('message').setValue(response.message);
		}
	}
}

module.exports = SingleResponseEntity;
