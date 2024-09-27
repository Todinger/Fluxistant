'use strict';
const { ApiPoller, AxiosRequestEngine, MockRequestEngine } = require('./apiPoller');
const _ = require('lodash');
const { MINUTES, SECONDS } = require('./constants');
const Errors = require('./errors');
const Globals = require("./globals");

// Twitch username regex: /[a-zA-Z0-9][\w]{2,24}/

const DOLLARS_PER_SP = 5;  // $5 for 1 SP

const CTV_BOT_USER = "captaintvbot";
const CTV_BOT_MESSAGES = {
	PURCHASE: /(?<player>[a-zA-Z0-9][\w]{2,24}) just purchased a (?<captain>[a-zA-Z0-9][\w]{2,24}) (?<skin>(?:(?<epic>Epic) )?(?:(?<variant>Gold|Diamond) )?(?:(?<color>Pink|Blue|Green) (?<holo>Holo) )?(?<unit>[\w ]+)) for \$(?<cost>[0-9]+)\.00! Thank you for supporting the channel!/,
	GIFT: /(?<player>[a-zA-Z0-9][\w]{2,24}) gifted a (?<type>(?<flag>Flag Bearer)?(?<head>Head)?(?<full>Full)?(?<epic>Epic)?(?<holo>Holo)?(?<variant>Gold|Diamond)?) skin to (?<recipient>[a-zA-Z0-9][\w]{2,24})!/,
	BOMB: {
		SINGLE: /(?<player>[a-zA-Z0-9][\w]{2,24}) gifted a (?<captain>[a-zA-Z0-9][\w]{2,24}) (?<skin>(?:(?<epic>Epic) )?(?:(?<variant>Gold|Diamond) )?(?:(?<color>Pink|Blue|Green) (?<holo>Holo) )?(?<unit>[\w ]+)) skin to (?<recipient>[a-zA-Z0-9][\w]{2,24})!/,
		MULTIPLE: /(?<player>[a-zA-Z0-9][\w]{2,24}) gifted (?<amount>\d+) (?<captain>[a-zA-Z0-9][\w]{2,24}) skins to .* and .* more people!.*/,
	},
	EPIC_PLACEMENT: /(?<player>[a-zA-Z0-9][\w]{2,24}) just placed an Epic (?<title>[^ ]+) (?<skin>.+) on the battlefield!/,
};

const NAMED_PURCHASE_REGEX = /eventId\\":\\"(?<eventId>[^\\"]*).*(?<skinName>skin[a-zA-Z0-9]*)_/gi;

/*
Input Examples
--------------
Purchase:
	Flag: MsSneakyTurtle just purchased a Fluxistence Flag Bearer for $5.00! Thank you for supporting the channel!
	Head: MsSneakyTurtle just purchased a Fluxistence Templar for $5.00! Thank you for supporting the channel!
	Full: rasstappen__69__ just purchased a Fluxistence Healer for $10.00! Thank you for supporting the channel!
	Epic: mixofseasonings just purchased a Fluxistence Epic Vampire for $10.00! Thank you for supporting the channel!
	Holo: cutsycat just purchased a Fluxistence Pink Holo Buster for $15.00! Thank you for supporting the channel!
	Gold: mixofseasonings just purchased a Fluxistence Gold Monk for $25.00! Thank you for supporting the channel!
	Diamond: lockmastah just purchased a Fluxistence Diamond Amazon for $25.00! Thank you for supporting the channel!
Gift:
	Flag: drpeppermd87 gifted a Flag Bearer skin to Puinacuppa!
	Head: EndlessSky82 gifted a Head skin to Meistar!
	Full: ContraNate gifted a Full skin to PoisonHearrt!
	Epic: DirtyFlirtyWolf gifted a Epic skin to Bruised420!
	Holo: cutsycat gifted a Holo skin to immerbock!
	Gold: DirtyFlirtyWolf gifted a Gold skin to Bruised420!
	Diamond: coldivfathom gifted a Diamond skin to Bruised420!
Single Bomb:
	Flag: Bruised420 gifted a Fluxistence Flag Bearer skin to CloverBug69!
	Head: YecatsX gifted a Fluxistence Healer skin to 24Slevin!
	Full: becca_mtbc gifted a Fluxistence Lancer skin to bitter1988!
	Epic: LiquidMusicEnt gifted a Fluxistence Epic Warbeast skin to mostly_talk!
	Holo: YecatsX gifted a Fluxistence Pink Holo Buster skin to Carlos_235!
	Gold: becca_mtbc gifted a Fluxistence Gold Warrior skin to itzCabooseMF!
	Diamond: Meistar gifted a Fluxistence Diamond Artillery skin to ForgeTheWolf!
Multi-Bomb:
	10: s0lskynn gifted 10 Fluxistence skins to bigtimebanjo, pawpawgoespewpew, Marcusow1986, NotedBinkie9727, grote9741, and 5 more people!  All recipients will be notified on the skins tab at https://www.streamraiders.com/
	20: 24Slevin gifted 20 Fluxistence skins to chairbreakerm8, NotedBinkie9727, piripia, 3aglesdwm, go_licpgm, and 15 more people!  All recipients will be notified on the skins tab at https://www.streamraiders.com/
	50: YecatsX gifted 50 Fluxistence skins to JQ_GOC, klayre_and_cat, BlasianIvy, ladyjessica84, Jersey_ci92, and 45 more people!  All recipients will be notified on the skins tab at https://www.streamraiders.com/
	100: AeroGarfield29 gifted 100 Fluxistence skins to GroverMonster, bethleves, MYKLMantis, Anzelagt, Deeztructor, and 95 more people!  All recipients will be notified on the skins tab at https://www.streamraiders.com/

Named Purchase:
	"{\"eventId\":\"666f0e6970a66\",\"eventType\":\"purchase-self\",\"twitchUserImage\":\"https:\\/\\/static-cdn.jtvnw.net\\/jtv_user_pictures\\/194e0ff8-8e59-4c7c-a5f3-d6e24ba64107-profile_image-300x300.png\",\"messageArgs\":[\"WitchyWoman503\",\"Full\",\"YecatsX Barbarian\"],\"messageImage\":\"https:\\/\\/d2k2g0zg1te1mr.cloudfront.net\\/overlays\\/battle-box\\/assets\\/units\\/skinFullBarbarianYecatsmailbox_walk.8fce65e213f2.gif\"}": "1718554217",
	"{\"eventId\":\"6670d539a1ae1\",\"eventType\":\"gift-targeted\",\"twitchUserImage\":\"https:\\/\\/static-cdn.jtvnw.net\\/jtv_user_pictures\\/c6ee5ca3-119f-4797-9260-f3fca5cb9a84-profile_image-300x300.png\",\"messageArgs\":[\"dezL0rd\",\"Full\",\"CrimsonK19\",\"YecatsX Rogue\"],\"messageImage\":\"https:\\/\\/d2k2g0zg1te1mr.cloudfront.net\\/overlays\\/battle-box\\/assets\\/units\\/skinFullRogueYecatsmailbox_walk.b2bd5c05e8ab.gif\"}": "1718670649"

Epic Placements:
	u captaintvbot nutshellinchains just placed an Epic chiquik Bomber on the battlefield!
	u captaintvbot scottacusb just placed an Epic BusyBeth Rogue on the battlefield!
	u captaintvbot fluxyphi just placed an Epic Anima Barbarian on the battlefield!
	u captaintvbot hairtrigger83 just placed an Epic Fluxistence Artillery on the battlefield!
	u captaintvbot r0b0c0p_ just placed an Epic Fluxistence Barbarian on the battlefield!
	u captaintvbot moondancing_unicorn just placed an Epic Fluxistence Lancer on the battlefield!
	u captaintvbot moondancing_unicorn just placed an Epic Fluxistence Lancer on the battlefield!
	u captaintvbot onywicked just placed an Epic Fluxistence Fairy on the battlefield!
	u captaintvbot chickenslash just placed an Epic PaopuKomi Healer on the battlefield!
	u captaintvbot nutshellinchains just placed an Epic Fluxistence Barbarian on the battlefield!
	u captaintvbot hairtrigger83 just placed an Epic Fluxistence Epic Paladin on the battlefield!
	u captaintvbot whuffless just placed an Epic Anne_Dyari Barbarian on the battlefield!
	u captaintvbot fridays_child just placed an Epic Tank on the battlefield!
	u captaintvbot endlesssky82 just placed an Epic Fluxistence Tank on the battlefield!
	u captaintvbot hairtrigger83 just placed an Epic Fluxistence Gold Barbarian on the battlefield!
	u captaintvbot moondancing_unicorn just placed an Epic fluxistence Barbarian on the battlefield!
	u captaintvbot lady_il_toccano just placed an Epic Fluxistence Epic Paladin on the battlefield!
*/

const API_URL = "https://www.streamraiders.com/api/game/?ss=$TOKEN&cn=$CN&command=$COMMAND";

const API_SETTINGS = {
	skinathon: {
		urlParams: {
			cn: "getSkinathonState",
			command: "getSkinathonState",
		},
		intervals: {
			// active: 2 * SECONDS,
			// inactive: 11 * SECONDS,
			active: 10 * SECONDS,
			inactive: 60 * MINUTES,
		},
		makeMockData: (startDate, skinPoints) => ({
			"info": {
				"version": "0.248.13",
				"dataPath": "https://streamcap-prod1.s3.amazonaws.com/data/data.745aeb1370c7.json",
				"dataVersion": "745aeb1370c7",
				"serverTime": "2024-05-03 23:09:06",
				"clientVersion": "0.87.1"
			},
			"status": "success",
			"data": {
				"twitchUserName": "fluxistence",
				"twitchDisplayName": "Fluxistence",
				"twitchUserImage": "https://static-cdn.jtvnw.net/jtv_user_pictures/0e43503e-d232-4aa8-aa2b-dcecac7ff82f-profile_image-300x300.png",
				"userId": "251374109c",
				"startDate": startDate,
				"totalSkinPoints": skinPoints,
				"rewardsData": null,
				"settingsId": "e931a7ffa3729b6aafdcb3c4b24901f0",
				"themeColor1": null,
				"themeColor2": null,
				"themeColor3": null,
				"themeColor4": null,
				"rowsToDisplay": null,
				"customRewards": null,
				"variantSkinType1": null,
				"variantSkinType2": null
			},
			"errorMessage": null
		}),
	},
	battleBox: {
		urlParams: {
			cn: "battleBox",
			command: "battleBox",
		},
		intervals: {
			// active: 2 * SECONDS,
			// inactive: 7 * SECONDS,
			active: 5 * SECONDS,
			inactive: 30 * SECONDS,
		},
		makeMockData: (state, minutes, seconds) => ({
			"info": {
				"version": "0.248.13",
				"dataPath": "https://streamcap-prod1.s3.amazonaws.com/data/data.745aeb1370c7.json",
				"dataVersion": "745aeb1370c7",
				"serverTime": "2024-05-03 23:09:06",
				"clientVersion": "0.87.1"
			},
			"status": "success",
			"data": {
				"settings": {
					"unitNotifs": 1,
					"epicNotifs": 1,
					"purchaseNotifs": 1,
					"giftNotifs": 1,
					"readyNotifs": 1,
					"unitVolume": 0,
					"epicVolume": 0,
					"purchaseVolume": 100,
					"giftVolume": 100,
					"readyVolume": 25,
					"useBackground": 1,
					"skinSelection": "alliesWarrior",
					"accentColor": "#bd00d6",
					"backgroundColor": "#ffae00",
					"autoDisplay": 0
				},
				"raid": {
					"id": -1,
					"minutes": minutes,
					"seconds": seconds,
					"state": state
				},
				"units": ["a"],
				"epics": [],
				"purchases": [],
				"gifts": [],
				"goal": {
					"type": "skinPoint",
					"target": 100,
					"progress": 28,
					"reward": "fullSkin"
				},
				"skins": [],
				"test": null
			},
			"errorMessage": null
		}),
	},
}


function fillUrlParameter(url, name, value) {
	return url.replace(`$${name.toUpperCase()}`, value);
}

function fillUrlParametersFromObject(url, obj) {
	Object.keys(obj).forEach(key => {
		url = fillUrlParameter(url, key, obj[key]);
	});
	return url;
}

class API {
	constructor(apiSettings, getActive, callback, errorCallback) {
		this.urlParams = apiSettings.urlParams;
		this.intervals = apiSettings.intervals;
		this.url = fillUrlParametersFromObject(API_URL, this.urlParams);
		this.getActive = getActive;
		this.callback = callback;

		this.mockRequestEngine = new MockRequestEngine();

		this.poller = new ApiPoller(
			"",
			this.intervals.inactive,
			(data) => this._onResponse(data),
			errorCallback
		);

		this.isMocking = false;
	}

	setToken(token) {
		this.url = fillUrlParameter(this.url, 'token', token);
		this.poller.setURL(this.url);
	}

	start() {
		this.poller.start();
	}

	stop() {
		this.poller.stop();
	}

	refresh() {
		this.poller.trigger();
	}

	mockResponses(responseData) {
		this.mockRequestEngine.setResponse(responseData);
		this.poller.setRequestEngine(this.mockRequestEngine);
		this.isMocking = true;
	}

	stopMockingResponses() {
		this.poller.setRequestEngine(AxiosRequestEngine.instance);
		this.isMocking = false;
	}

	_onResponse(data) {
		this.callback(data);
		this.poller.setInterval(this.getActive() ? this.intervals.active : this.intervals.inactive);
	}
}



class StreamRaidersBaseState {
	represents(data) {
		Errors.abstract();
		return false;
	}

	get isActive() {
		Errors.abstract();
		return false;
	}
}

class SkinathonState extends StreamRaidersBaseState{
	constructor(data) {
		super();

		data = data || {};
		this.totalSkinPoints = data['totalSkinPoints'] || 0;
		this.startDate = data['startDate'] || null;
	}

	represents(data) {
		if (!data) return false;
		return data['totalSkinPoints'] === this.totalSkinPoints &&
			data['startDate'] === this.startDate;
	}

	get isActive() {
		return this.startDate !== null;
	}
}

class BattleState extends StreamRaidersBaseState {
	constructor(data) {
		super();

		data = data || {};
		this.raid = BattleState.makeRaidData(data['raid']);
	}

	represents(data) {
		data = data || {};
		let raidData = BattleState.makeRaidData(data['raid']);
		return _.isEqual(this.raid, raidData);
	}

	get isActive() {
		return this.raid.state === 1;
	}

	static makeRaidData(rawData) {
		rawData = rawData || {};
		return {
			minutes: rawData['minutes'] || 0,
			seconds: rawData['seconds'] || 0,
			state: rawData['state'] || 0,
		}
	}
}


class SkinPurchaseDetailsBase {
	constructor(details) {
		this.player = details['player'];
		this.playerUsername = this.player.toLowerCase();
		this.sp = 0;
	}

	toString() {
		Errors.abstract();
	}
}

class SkinPurchaseDetails extends SkinPurchaseDetailsBase {
	constructor(details) {
		super(details);
		this.captain = details['captain'];
		this.skin = details['skin'];
		this.epic = details['epic'];
		this.variant = details['variant'];
		this.color = details['color'];
		this.holo = details['holo'];
		this.unit = details['unit'];
		this.cost = parseInt(details['cost']);

		this.sp = this.cost / DOLLARS_PER_SP;

		if (this.sp === 1) {
			if (this.unit === "Flag Bearer") {
				this.flag = "Flag Bearer";
			} else {
				this.head = "Head";
			}
		}

		if (this.sp === 2 && !this.epic) {
			this.full = "Full";
		}
	}

	toString() {
		let skinDesc =
			this.head ? "Head " :
			this.full ? "Full " :
			"";
		return `(${this.sp} SP) Purchase: ${this.skin} ${skinDesc}Skin`;
	}
}

class SkinGiftDetails extends SkinPurchaseDetailsBase {
	constructor(details) {
		super(details);
		this.flag = details['flag'];
		this.head = details['head'];
		this.full = details['full'];
		this.epic = details['epic'];
		this.holo = details['holo'];
		this.variant = details['variant'];
		this.type = details['type'];
		this.recipient = details['recipient'];

		if (this.flag || this.head) {
			this.sp = 1;
		} else if (this.full || this.epic) {
			this.sp = 2;
		} else if (this.holo) {
			this.sp = 3;
		} else if (this.variant) {
			this.sp = 5;
		} else {
			throw "Unknown skin gift!";
		}
	}

	toString() {
		return `(${this.sp} SP) Gift: ${this.type} Skin to ${this.recipient}`;
	}
}

class SkinBombSingleDetails extends SkinPurchaseDetailsBase {
	constructor(details) {
		super(details);
		this.captain = details['captain'];
		this.skin = details['skin'];
		this.epic = details['epic'];
		this.variant = details['variant'];
		this.holo = details['holo'];
		this.color = details['color'];
		this.unit = details['unit'];
		this.recipient = details['recipient'];

		this.sp = 1;
	}

	toString() {
		return `(${this.sp} SP) Skin Bomb: 1`;
	}
}

class SkinBombMultiDetails extends SkinPurchaseDetailsBase {
	constructor(details) {
		super(details);
		this.captain = details['captain'];
		this.amount = parseInt(details['amount']);

		this.sp = this.amount;
	}

	toString() {
		return `(${this.sp} SP) Skin Bomb: ${this.amount}`;
	}
}

class NamedPurchase {
	constructor(details) {
		this.eventId = details['eventId'];
		this.skinName = details['skinName'];
	}
}

class EpicPlacement {
	constructor(details) {
		this.player = details['player'];
		this.title = details['title'];
		this.skin = details['skin'];
		this.fullSkinName = `${this.title} ${this.skin}`;
		this.isStreamSkin = this.title.toLowerCase() === Globals.StreamerUser.name.toLowerCase();
	}
}


module.exports = {
	CTV_BOT_USER,
	CTV_BOT_MESSAGES,
	NAMED_PURCHASE_REGEX,
	API_SETTINGS,
	API,
	SkinathonState,
	BattleState,
	SkinPurchaseDetails,
	SkinGiftDetails,
	SkinBombSingleDetails,
	SkinBombMultiDetails,
	NamedPurchase,
	EpicPlacement,
};
