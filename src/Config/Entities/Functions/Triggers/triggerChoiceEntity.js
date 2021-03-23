const ChoiceEntity = require('../../choiceEntity');

class TriggerChoiceEntity extends ChoiceEntity {
	static get TYPE()		{ return 'TriggerChoice'; 					}
	static get GUITYPE()	{ return 'ExpandableChoice'; 				}
	static get BUILDER()	{ return () => new TriggerChoiceEntity(); 	}
	
	constructor() {
		super();
		this._addOptions({
			["command"]:			'Trigger_Command',
			["shortcut"]:			'Trigger_Shortcut',
			["keyDown"]:			'Trigger_KeyDown',
			["keyUp"]:				'Trigger_KeyUp',
			["reward"]:				'Trigger_ChannelReward',
			["windowActivated"]:	'Trigger_WindowActivated',
			["windowDeactivated"]:	'Trigger_WindowDeactivated',
			["windowStarted"]:		'Trigger_WindowStarted',
			["windowExited"]:		'Trigger_WindowExited',
		});
	}
}

module.exports = TriggerChoiceEntity;
