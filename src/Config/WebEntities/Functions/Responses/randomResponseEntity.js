const ResponseEntity = require('./responseEntity');

class RandomResponseEntity extends ResponseEntity {
	static get TYPE()       { return null; }	// Avoid construction (abstract type)
	
	constructor(displayText) {
		super(displayText);
		this.addDynamicArray('messages', 'String')
			.setName('Message Options')
			.setDescription('One of these will be randomly selected for the response');
	}
	
	setData(response) {
		if (response) {
			this.getChild('messages').setValue(response.messages);
		}
	}
}

module.exports = RandomResponseEntity;
