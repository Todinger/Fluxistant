const ChoiceEntity = require('../../choiceEntity');

class TriggerChoiceEntity extends ChoiceEntity {
	static get TYPE()		{ return 'TriggerChoice'; 					}
	static get GUITYPE()	{ return 'ExpandableChoice'; 				}
	static get BUILDER()	{ return () => new TriggerChoiceEntity(); 	}
	
	constructor() {
		super();
		this._addOptions({
			["command"]:								'Trigger_Command',
			["cli"]:									'Trigger_Cli',
			["message"]:								'Trigger_Message',
			["shortcut"]:								'Trigger_Shortcut',
			["keyDown"]:								'Trigger_KeyDown',
			["keyUp"]:									'Trigger_KeyUp',
			["reward"]:									'Trigger_ChannelReward',
			["windowActivated"]:						'Trigger_WindowActivated',
			["windowDeactivated"]:						'Trigger_WindowDeactivated',
			["windowStarted"]:							'Trigger_WindowStarted',
			["windowExited"]:							'Trigger_WindowExited',
			["host"]:									'Trigger_Host',
			["raid"]:									'Trigger_Raid',
			["time"]:									'Trigger_Time',
			["streamRaidersBattleEnded"]:				'Trigger_StreamRaidersBattleEnded',
			["streamRaidersSkinathonPointsChanged"]:	'Trigger_StreamRaidersSkinathonPointsChanged',
			["streamRaidersBattleStarted"]:				'Trigger_StreamRaidersBattleStarted',
			["streamRaidersAnySkinPurchase"]:			'Trigger_StreamRaidersAnySkinPurchase',
			["streamRaidersSingleSkinPurchase"]:		'Trigger_StreamRaidersSingleSkinPurchase',
			["streamRaidersSkinGift"]:					'Trigger_StreamRaidersSkinGift',
			["streamRaidersSingleSkinBomb"]:			'Trigger_StreamRaidersSingleSkinBomb',
			["streamRaidersMultiSkinBomb"]:				'Trigger_StreamRaidersMultiSkinBomb',
		});
	}
}

module.exports = TriggerChoiceEntity;
