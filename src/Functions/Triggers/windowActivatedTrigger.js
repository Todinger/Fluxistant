const WindowStatusTrigger = require('./windowStatusTrigger');

class WindowActivatedTrigger extends WindowStatusTrigger {
	constructor(settings) {
		super('activated', settings);
	}
	
	get type() {
		return "windowActivated";
	}
}

module.exports = WindowActivatedTrigger;
