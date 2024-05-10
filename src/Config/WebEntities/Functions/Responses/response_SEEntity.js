const SingleResponseEntity = require('./singleResponseEntity');

class Response_SEEntity extends SingleResponseEntity {
	static get TYPE()		{ return 'Response_SE'; 					}
	static get BUILDER()	{ return () => new Response_SEEntity(); 	}
	
	constructor() {
		super('StreamElements Message');
		this.setDescription('Makes the StreamElements bot send the response to the channel');
	}
}

module.exports = Response_SEEntity;
