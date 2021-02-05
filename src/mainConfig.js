const Configuration = require('./configuration');

const DEFAULT_PORT = 3333;

class MainConfig extends Configuration {
	constructor() {
		super();
		this.addChild('port', 'Integer', DEFAULT_PORT)
			.setName('Port')
			.setDescription('Server port to listen on');
	}
	
	getPort() {
		return this.getChild('port').getValue();
	}
}

module.exports = new MainConfig();
