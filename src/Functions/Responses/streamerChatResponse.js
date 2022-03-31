const FunctionResponse = require('./functionResponse');
const TwitchManager = requireMain('./twitchManager');

class StreamerChatResponse extends FunctionResponse {
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
