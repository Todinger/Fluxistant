const Trigger = require('./functionTrigger');
const Utils = requireMain('utils');

class TimeTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.minInterval = settings && settings.minInterval;
		this.maxInterval = settings && settings.maxInterval;
		this.timerHandle = null;
	}
	
	get type() {
		return "timer";
	}
	
	_activateImpl() {
		if (!this.timerHandle) {
			this._scheduleNext();
		}
	}
	
	_deactivateImpl() {
		if (this.timerHandle) {
			clearTimeout(this.timerHandle);
			this.timerHandle = null;
		}
	}
	
	_scheduleNext() {
		this.timerHandle = setTimeout(
			() => this._onTimeout(),
			Utils.randomInt(this.minInterval, this.maxInterval));
	}
	
	_onTimeout() {
		this._triggerDefault();
		this._scheduleNext();
	}
}

module.exports = TimeTrigger;
