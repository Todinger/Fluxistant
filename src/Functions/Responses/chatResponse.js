const FunctionResponse = require('./functionResponse');
const TwitchManager = requireMain('./twitchManager');

class ChatResponse extends FunctionResponse {
	constructor(params) {
		super(params);
	}
	
	_sendImpl(finalText) {
		TwitchManager.say(finalText);
	}
}

module.exports = ChatResponse;
