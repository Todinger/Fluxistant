
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
		this.Logger = null;
	}
}

module.exports = new Globals();
