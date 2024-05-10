const RandomResponseEntity = require('./randomResponseEntity');

class Response_RandomChatEntity extends RandomResponseEntity {
	static get TYPE()		{ return 'Response_RandomChat'; 					}
	static get BUILDER()	{ return () => new Response_RandomChatEntity(); 	}
	
	constructor() {
		super('Random Chat Message');
		this.setDescription('Sends a random response to the channel chat from given options');
	}
}

module.exports = Response_RandomChatEntity;
