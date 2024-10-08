const path = require('path');

const DEFAULTS = {
	cli: console,
}

// CliManager requires EventNotifier for inheritence, and that file requires
// CliManager for printing, but that's circular and Node.js doesn't deal with
// that well, so we're forced to implement a workaround and use a globally-set
// variable which will be set once CliManager is built.
// That is what this class is for.
class Globals {
	constructor() {
		// Set defaults
		Object.keys(DEFAULTS).forEach(key => this[key] = DEFAULTS[key]);
		
		this.userDir = null;
		this.userModulesDir = null;
		this.Logger = null;
		this.StreamerUser = null;
		this.functionBuilders = null;
	}
	
	getModuleUserDir(moduleName) {
		return path.join(this.userModulesDir, moduleName);
	}
}

module.exports = new Globals();
