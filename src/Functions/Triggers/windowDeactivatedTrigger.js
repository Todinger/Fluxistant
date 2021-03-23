const WindowStatusTrigger = require('./windowStatusTrigger');

class WindowActivatedTrigger extends WindowStatusTrigger {
	constructor(settings) {
		super('deactivated', settings);
	}
	
	get type() {
		return "windowDeactivated";
	}
}

module.exports = WindowActivatedTrigger;
