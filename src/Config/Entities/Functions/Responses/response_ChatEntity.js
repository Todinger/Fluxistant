const ResponseEntity = require('./responseEntity');

class Response_ChatEntity extends ResponseEntity {
	static get TYPE()		{ return 'Response_Chat'; 					}
	static get BUILDER()	{ return () => new Response_ChatEntity(); 	}
	
	constructor() {
		super('Chat Message');
		this.setDescription('Sends the response to the channel chat');
	}
}

module.exports = Response_ChatEntity;
