const ChoiceEntity = require('../../choiceEntity');

class TriggerChoiceEntity extends ChoiceEntity {
	static get TYPE()		{ return 'TriggerChoice'; 					}
	static get GUITYPE()	{ return 'ExpandableChoice'; 				}
	static get BUILDER()	{ return () => new TriggerChoiceEntity(); 	}
	
	constructor() {
		super();
		this._addOptions({
			["command"]:			'Trigger_Command',
			["message"]:			'Trigger_Message',
			["shortcut"]:			'Trigger_Shortcut',
			["keyDown"]:			'Trigger_KeyDown',
			["keyUp"]:				'Trigger_KeyUp',
			["reward"]:				'Trigger_ChannelReward',
			["windowActivated"]:	'Trigger_WindowActivated',
			["windowDeactivated"]:	'Trigger_WindowDeactivated',
			["windowStarted"]:		'Trigger_WindowStarted',
			["windowExited"]:		'Trigger_WindowExited',
			["host"]:				'Trigger_Host',
			["raid"]:				'Trigger_Raid',
			["time"]:				'Trigger_Time',
		});
	}
}

module.exports = TriggerChoiceEntity;
