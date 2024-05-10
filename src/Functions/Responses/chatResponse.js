const FunctionResponseSingle = require('./functionResponseSingle');
const TwitchManager = requireMain('./twitchManager');

class ChatResponse extends FunctionResponseSingle {
	constructor(params) {
		super(params);
	}
	
	get type() {
		return 'chat';
	}
	
	_sendImpl(finalText) {
		TwitchManager.say(finalText);
	}
}

module.exports = ChatResponse;
