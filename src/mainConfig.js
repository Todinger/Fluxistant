const Configuration = require('./configuration');

const DEFAULT_PORT = 3333;

class MainConfig extends Configuration {
	constructor() {
		super('main');
		this.addInteger('port', DEFAULT_PORT)
			.setName('Port')
			.setDescription('Server port to listen on');
		this.addString('streamerName')
			.setName('Streamer Name')
			.setDescription('How the bot addresses you in the chat when it does (for whatever reason...)');
	}
	
	getPort() {
		return this.getChild('port').getValue();
	}
	
	getStreamerName() {
		return this.getChild('streamerName').getValue();
	}
}

module.exports = new MainConfig();
