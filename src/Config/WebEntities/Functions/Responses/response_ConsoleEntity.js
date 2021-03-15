const ResponseEntity = require('./responseEntity');

class Response_ConsoleEntity extends ResponseEntity {
	static get TYPE()		{ return 'Response_Console'; 					}
	static get BUILDER()	{ return () => new Response_ConsoleEntity(); 	}
	
	constructor() {
		super('Console');
		this.setDescription('Prints the response on the bot console');
		this.add('level', 'LogLevel')
			.setName('Log Level')
			.setDescription('Level of the message in the chat (which messages show up depends on the active viewing level)');
	}
	
	setData(responseData) {
		super.setData(responseData);
		if (responseData && responseData.response && responseData.response.level) {
			this.getChild('level').select(responseData.response.level);
		}
	}
}

module.exports = Response_ConsoleEntity;
