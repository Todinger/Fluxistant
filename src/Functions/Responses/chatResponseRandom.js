const FunctionResponseRandom = require('./functionResponseRandom');
const TwitchManager = requireMain('./twitchManager');

class ChatResponse extends FunctionResponseRandom {
	constructor(params) {
		super(params);
	}
	
	get type() {
		return 'chatRandom';
	}
	
	_sendImpl(finalText) {
		TwitchManager.say(finalText);
	}
}

module.exports = ChatResponse;
