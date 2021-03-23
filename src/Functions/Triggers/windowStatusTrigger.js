const Trigger = require('./functionTrigger');
const Process = requireMain('./process');
const Utils = requireMain('./utils');

const USER_SECONDS = 1000;
const DEFAULT_CHECK_INTERVAL = 2 * USER_SECONDS; // Check every 2 seconds by default

// This should theoretically be an abstract class, since the event it listens
// to should come from inheriting classes
class WindowStatusTrigger extends Trigger {
	constructor(eventName, settings) {
		super(settings);
		this.process = null;
		this.title = null;
		this.checkInterval = 0;
		
		if (settings) {
			let checkInterval = settings.checkInterval;
			if (typeof checkInterval === 'string') {
				checkInterval = Number(checkInterval);
			}
			
			if (!isNaN(checkInterval) && checkInterval > 0) {
				this.checkInterval = checkInterval * USER_SECONDS;
			} else {
				this.checkInterval = DEFAULT_CHECK_INTERVAL;
			}
			
			this.title = Utils.getDefaultProperty(settings, 'title');
			if (this.title) {
				this.process = new Process(this.title, this.checkInterval);
				this.process.on(eventName, () => this._handleWindowStatusChanged());
			}
		}
	}
	
	_handleWindowStatusChanged() {
		this._triggerDefault();
	}
	
	_activateImpl() {
		if (this.process) {
			this.process.startMonitoring();
		}
	}
	
	_deactivateImpl() {
		if (this.process) {
			this.process.stopMonitoring();
		}
	}
}

module.exports = WindowStatusTrigger;
