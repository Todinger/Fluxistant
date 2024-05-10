const FunctionResponseSingle = require('./functionResponseSingle');
const TwitchManager = requireMain('./twitchManager');

class StreamerChatResponse extends FunctionResponseSingle {
	constructor(params) {
		super(params);
	}
	
	get type() {
		return 'chat';
	}
	
	_sendImpl(finalText) {
		TwitchManager.streamerSay(finalText);
	}
}

module.exports = StreamerChatResponse;
