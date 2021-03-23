const TriggerEntity = require('./triggerEntity');

class Trigger_WindowStatusBaseEntity extends TriggerEntity {
	static get TYPE()		{ return null;	} // Abstract type, avoid instantiation
	
	constructor(displayText, data) {
		super(displayText);
		this.setDescription('Activates this function when the selected channel reward is redeemed');
		this.addString('title')
			.setName('Window Title')
			.setDescription('The title of the window to check for (this is what shows up when you hover the mouse over the window in the Task Bar)');
		this.addString('checkInterval')
			.setName('Check Interval')
			.setDescription('How often (in seconds) the bot checks to see window status changes (the trigger may take up to this much time to activate)')
			.setAdvanced();
		
		this.setData(data);
	}
	
	setData(data) {
		super.setData(data);
		if (data) {
			if (data.title) {
				this.getChild('title').setValue(data.title);
			}
			
			if (data.checkInterval) {
				this.getChild('checkInterval').setValue(data.checkInterval);
			}
		}
	}
}

module.exports = Trigger_WindowStatusBaseEntity;
