const Configuration = require('./configuration');

const DEFAULT_PORT = 3333;

class MainConfig extends Configuration {
	constructor() {
		super();
		this.addChild('port', 'Value', DEFAULT_PORT);
	}
	
	getPort() {
		return this.getChild('port').getValue();
	}
}

module.exports = new MainConfig();
