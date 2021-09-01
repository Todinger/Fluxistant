const assert = require('assert').strict;
const TriggerEntity = require('./triggerEntity');

class Trigger_TimeEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_Time'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_TimeEntity(...p); 	}
	
	constructor(data) {
		super('Time');
		this.setDescription('Activates this function in specified intervals');
		this.addDuration('minInterval', 0)
			.setName('Minimum Interval')
			.setDescription('At least this many seconds will pass between activations');
		this.addDuration('maxInterval', 1)
			.setName('Maximum Interval')
			.setDescription('At most this many seconds will pass between activations');
		
		this.setData(data);
	}
	
	setData(data) {
		super.setData(data);
		if (data && data.minInterval) {
			this.getChild('minInterval').setValue(data.minInterval);
		}
		if (data && data.maxInterval) {
			this.getChild('maxInterval').setValue(data.maxInterval);
		}
	}
	
	validate() {
		super.validate();
		assert(
			this.getChild('minInterval').getValue() <= this.getChild('maxInterval').getValue(),
			'Minimum interval must be <= maximum interval.');
	}
}

module.exports = Trigger_TimeEntity;
