const WindowStatusTrigger = require('./windowStatusTrigger');

class WindowActivatedTrigger extends WindowStatusTrigger {
	constructor(settings) {
		super('exited', settings);
	}
	
	get type() {
		return "windowExited";
	}
}

module.exports = WindowActivatedTrigger;
