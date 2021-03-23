const WindowStatusTrigger = require('./windowStatusTrigger');

class WindowActivatedTrigger extends WindowStatusTrigger {
	constructor(settings) {
		super('started', settings);
	}
	
	get type() {
		return "windowStarted";
	}
}

module.exports = WindowActivatedTrigger;
