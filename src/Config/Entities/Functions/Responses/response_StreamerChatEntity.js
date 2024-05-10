const SingleResponseEntity = require('./singleResponseEntity');

class Response_StreamerChatEntity extends SingleResponseEntity {
	static get TYPE()		{ return 'Response_StreamerChat'; 					}
	static get BUILDER()	{ return () => new Response_StreamerChatEntity(); 	}
	
	constructor() {
		super('Streamer Chat Message');
		this.setDescription("Sends the response to the channel chat via the streamer's account");
	}
}

module.exports = Response_StreamerChatEntity;
