'use strict';
const EventNotifier = require('./eventNotifier');
const { ApiPoller, AxiosRequestEngine, MockRequestEngine } = require('./apiPoller');
const _ = require('lodash');
const Logger = require('./logger');
const cli = require('./cliManager');
const TwitchManager = require('./twitchManager');
const Utils = require('./utils');
const Errors = require('./errors');


const SECONDS = 1000;
const ONE_SECOND = 1000;
// const MINUTES = 60 * SECONDS;

// Twitch username regex: /[a-zA-Z0-9][\w]{2,24}/

const CTV_BOT_USER = "captaintvbot";
const SKIN_BOMB_AGGREGATION_PATIENCE = 5 * SECONDS;
const SKIN_BOMB_AGGREGATION_INTERVAL = ONE_SECOND;
const CTV_BOT_MESSAGES = {
	PURCHASE: /(?<player>[a-zA-Z0-9][\w]{2,24}) just purchased a (?<captain>[a-zA-Z0-9][\w]{2,24}) (?<skin>(?:(?<epic>Epic) )?(?:(?<gold>Gold) )?(?:(?<color>Pink|Blue|Green) (?<holo>Holo) )?(?<unit>[\w ]+)) for \$(?<cost>[0-9]+)\.00! Thank you for supporting the channel!/,
	GIFT: /(?<player>[a-zA-Z0-9][\w]{2,24}) gifted a (?<flag>Flag Bearer)?(?<head>Head)?(?<full>Full)?(?<epic>Epic)?(?<holo>Holo)?(?<gold>Gold)? skin to (?<recipient>[a-zA-Z0-9][\w]{2,24})!/,
	BOMB: {
		SINGLE: /(?<player>[a-zA-Z0-9][\w]{2,24}) gifted a (?<captain>[a-zA-Z0-9][\w]{2,24}) (?<skin>(?:Gold )?(?:Holo )?(?:Epic )?(?<unit>[\w ]+)) skin to (?<recipient>[a-zA-Z0-9][\w]{2,24})!/,
		MULTIPLE: /(?<player>[a-zA-Z0-9][\w]{2,24}) gifted (?<amount>\d+) (?<captain>[a-zA-Z0-9][\w]{2,24}) skins to .* and .* more people!.*/,
	},
};
// const CTV_BOT_MESSAGES = {
// 	PURCHASE: {
// 		ALL: /(?<player>[a-zA-Z0-9][\w]{2,24}) just purchased a (?<captain>[a-zA-Z0-9][\w]{2,24}) (?<skin>(?:(?<epic>Epic) )?(?:(?<gold>Gold) )?(?:(?<color>Pink|Blue|Green) (?<holo>Holo) )?(?<unit>[\w ]+)) for \$(?<cost>[0-9]+)\.00! Thank you for supporting the channel!/,
// 		FLAG: /(?<player>[a-zA-Z0-9][\w]{2,24}) just purchased a (?<captain>[a-zA-Z0-9][\w]{2,24}) (?<skin>(?<unit>Flag Bearer)) for \$5.00! Thank you for supporting the channel!/,
// 		HEAD: /(?<player>[a-zA-Z0-9][\w]{2,24}) just purchased a (?<captain>[a-zA-Z0-9][\w]{2,24}) (?<skin>(?<unit>[\w ]+)) for \$5\.00! Thank you for supporting the channel!/,
// 		// Note: FULL also captures EPIC/HOLO/GOLD for one-word skins, so FULL needs to be checked last
// 		FULL: /(?<player>[a-zA-Z0-9][\w]{2,24}) just purchased a (?<captain>[a-zA-Z0-9][\w]{2,24}) (?<skin>(?<unit>[\w ]+)) for \$10\.00! Thank you for supporting the channel!/,
// 		EPIC: /(?<player>[a-zA-Z0-9][\w]{2,24}) just purchased a (?<captain>[a-zA-Z0-9][\w]{2,24}) (?<skin>Epic (?<unit>[\w ]+)) for \$10\.00! Thank you for supporting the channel!/,
// 		HOLO: /(?<player>[a-zA-Z0-9][\w]{2,24}) just purchased a (?<captain>[a-zA-Z0-9][\w]{2,24}) (?<skin>(?<color>Pink|Blue|Green) Holo (?<unit>[\w ]+)) for \$15\.00! Thank you for supporting the channel!/,
// 		GOLD: /(?<player>[a-zA-Z0-9][\w]{2,24}) just purchased a (?<captain>[a-zA-Z0-9][\w]{2,24}) (?<skin>Gold (?<unit>[\w ]+)) for \$25\.00! Thank you for supporting the channel!/,
// 	},
// 	GIFT: {
// 		ALL: /(?<player>[a-zA-Z0-9][\w]{2,24}) gifted a (?<flag>Flag Bearer)?(?<head>Head)?(?<full>Full)?(?<epic>Epic)?(?<holo>Holo)?(?<gold>Gold)? skin to (?<recipient>[a-zA-Z0-9][\w]{2,24})!/,
// 		FLAG: /(?<player>[a-zA-Z0-9][\w]{2,24}) gifted a (?<skin>Flag Bearer) skin to (?<recipient>[a-zA-Z0-9][\w]{2,24})!/,
// 		HEAD: /(?<player>[a-zA-Z0-9][\w]{2,24}) gifted a (?<skin>Head) skin to (?<recipient>[a-zA-Z0-9][\w]{2,24})!/,
// 		FULL: /(?<player>[a-zA-Z0-9][\w]{2,24}) gifted a (?<skin>Full) skin to (?<recipient>[a-zA-Z0-9][\w]{2,24})!/,
// 		EPIC: /(?<player>[a-zA-Z0-9][\w]{2,24}) gifted a (?<skin>Epic) skin to (?<recipient>[a-zA-Z0-9][\w]{2,24})!/,
// 		HOLO: /(?<player>[a-zA-Z0-9][\w]{2,24}) gifted a (?<skin>Holo) skin to (?<recipient>[a-zA-Z0-9][\w]{2,24})!/,
// 		GOLD: /(?<player>[a-zA-Z0-9][\w]{2,24}) gifted a (?<skin>Gold) skin to (?<recipient>[a-zA-Z0-9][\w]{2,24})!/,
// 	},
// 	BOMB: {
// 		SINGLE: /(?<player>[a-zA-Z0-9][\w]{2,24}) gifted a (?<captain>[a-zA-Z0-9][\w]{2,24}) (?<skin>(?:Gold )?(?:Holo )?(?:Epic )?(?<unit>[\w ]+)) skin to (?<recipient>[a-zA-Z0-9][\w]{2,24})!/,
// 		MULTIPLE: /(?<player>[a-zA-Z0-9][\w]{2,24}) gifted (?<amount>\d+) (?<captain>[a-zA-Z0-9][\w]{2,24}) skins to .* and .* more people!.*/,
// 	},
// };

const API_URL = "https://www.streamraiders.com/api/game/?ss=$TOKEN&cn=$CN&command=$COMMAND";

const API_SETTINGS = {
	skinathon: {
		urlParams: {
			cn: "getSkinathonState",
			command: "getSkinathonState",
		},
		intervals: {
			active: 1000, // One second
			inactive: 20 * SECONDS,
			// active: 30 * SECONDS,
			// inactive: 60 * MINUTES,
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
			active: SECONDS,
			inactive: 10 * SECONDS,
			// active: 10 * SECONDS,
			// inactive: 30 * SECONDS,
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
				"units": [],
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


// Responsible for all interaction with Stream Raiders.
// I write "interaction," but really it only supports one-way, incoming communication.
// It is meant to be used for reading information and notifying about events.
// It does not and is not meant to ever support "writing" data (placing units or anything
// of the sort), as that violates the Stream Raiders usage policy.
// If they add official APIs for such things in the future, this class may support them then.
// Until then - this is "read only" access.
class StreamRaidersManager extends EventNotifier {
	constructor() {
		super(false);

		this._token = null;

		this.states = {
			skinathon: new SkinathonState(),
			battle: new BattleState(),
		}

		this.apis = {
			skinathon: new API(
				API_SETTINGS.skinathon,
				() => this.states.skinathon.isActive,
				(data) => this._updateSkinathonState(data),
				(err) => this._apiError("Skinathon", err),
			),
			battleBox: new API(
				API_SETTINGS.battleBox,
				() => this.states.battle.isActive,
				(data) => this._updateBattleState(data),
				(err) => this._apiError("BattleBox", err),
			),
		}

		this._addEvent('skinathonChanged');
		this._addEvent('skinathonPointsChanged');
		this._addEvent('battleChanged');
		this._addEvent('battleStarted');
		this._addEvent('battleEnded');
		this._addEvent('battleTimerSync');

		cli.on('sr-mock', () => this.mockData());
		cli.on('sr-mock-stop', () => this.stopMockingData());
		cli.on('sr-refresh', () => this._refresh());

		this._onMessageHandler = (user, message) => this._onChatMessage(user, message);
		this._messageHandlers = [
			{regex: CTV_BOT_MESSAGES.PURCHASE, handler: (details) => this._emitSkinPurchase(details)},
			{regex: CTV_BOT_MESSAGES.GIFT, handler: (details) => this._emitSkinGifted(details)},
			{regex: CTV_BOT_MESSAGES.BOMB.SINGLE, handler: (details) => this._onSkinBombSinglePurchase(details)},
			{regex: CTV_BOT_MESSAGES.BOMB.MULTIPLE, handler: (details) => this._emitSkinBombMulti(details)},
		];
		this._singleBombQueues = {};
		this._bombAggregationTimer = null;

		// this._messageHandlers = {
		// 	[CTV_BOT_MESSAGES.PURCHASE]: (match) => this._emitSkinPurchase(match),
		// 	[CTV_BOT_MESSAGES.GIFT]: (match) => this._emitSkinGifted(match),
		// 	[CTV_BOT_MESSAGES.BOMB.SINGLE]: (match) => this._onSkinBombSinglePurchase(match),
		// 	[CTV_BOT_MESSAGES.BOMB.MULTIPLE]: (match) => this._emitSkinBombMulti(match),
		// };

		this.logging = false;
		this.errorLogging = true;
	}

	_apiError(apiName, err) {
		if (this.errorLogging) {
			Logger.warn(`[StreamRaidersManager] Error in ${apiName} API: ${err}`);
		}
	}

	_updateSkinathonState(data) {
		// this.log(`updateSkinathonState: data = ${JSON.stringify(data)}`);
		if (!this.states.skinathon.represents(data['data'])) {
			let oldState = this.states.skinathon;
			let newState = this.states.skinathon = new SkinathonState(data['data']);
			this._notifySkinathonChanged(newState, oldState);

			if (newState.totalSkinPoints !== oldState.totalSkinPoints) {
				this._notifySkinathonPointsChanged(newState.totalSkinPoints, oldState.totalSkinPoints);
			}
		}

		if (this.apis.skinathon.isMocking) {
			this.apis.skinathon.mockResponses(API_SETTINGS.skinathon.makeMockData(
				Date.now(),
				this.states.skinathon.totalSkinPoints + 5,
			));
		}
	}

	_updateBattleState(data) {
		// this.log(`_updateBattleState: data = ${JSON.stringify(data)}`);
		if (!this.states.battle.represents(data['data'])) {
			let oldState = this.states.battle;
			let newState = this.states.battle = new BattleState(data['data']);
			this._notifyBattleChanged(newState, oldState);

			if (newState.isActive && !oldState.isActive) {
				this._notifyBattleStarted();
			} else if (!newState.isActive && oldState.isActive) {
				this._notifyBattleEnded();
			}

			this._notifyBattleTimerSync(newState.raid.minutes, newState.raid.seconds);
		}

		if (this.apis.battleBox.isMocking) {
			this.apis.battleBox.mockResponses(API_SETTINGS.battleBox.makeMockData(
				1,
				this.states.battle.raid.minutes + 1,
				(this.states.battle.raid.seconds + 1) % 60,
			));
		}
	}

	_updateAPIs() {
		Object.keys(this.apis).forEach(apiName => {
			this.apis[apiName].setToken(this._token);
		});
	}

	_refresh() {
		Object.keys(this.apis).forEach(apiName => {
			this.apis[apiName].refresh();
		});
	}

	_onChatMessage(user, message) {
		if (user.name !== CTV_BOT_USER) return;

		let match = null;
		for (let handlerDesc of this._messageHandlers) {
			match = handlerDesc.regex.exec(message);
			if (match) {
				handlerDesc.handler(match.groups);
				return;
			}
		}
		// if ((match = CTV_BOT_MESSAGES.PURCHASE.exec(message)) !== null) this._emitSkinPurchase(match);
		// else if ((match = CTV_BOT_MESSAGES.GIFT.exec(message)) !== null) this._emitSkinGifted(match);
		// else if ((match = CTV_BOT_MESSAGES.BOMB.SINGLE.exec(message)) !== null) this._onSkinBombSinglePurchase(match);
		// else if ((match = CTV_BOT_MESSAGES.BOMB.MULTIPLE.exec(message)) !== null) this._emitSkinBombMulti(match);
	}

	_emitSkinPurchase(details) {
		console.log(`Skin purchase: ${JSON.stringify(details)}`);
	}

	_emitSkinGifted(details) {
		console.log(`Skin gift: ${JSON.stringify(details)}`);
	}

	_onSkinBombSinglePurchase(details) {
		console.log(`[SQ] Skin bomb single pushed to queue: ${JSON.stringify(details)}`);

		let player = details['player'];
		if (!(player in this._singleBombQueues)) {
			this._singleBombQueues[player] = [];
		}
		if (this._singleBombQueues[player].length + 1 >= 5) {  // Five-bomb found
			this._emitSkinBombMulti({
				player,
				amount: 5,
				captain: details['captain'],
			});
			delete this._singleBombQueues[player];
			return;
		}

		this._singleBombQueues[player].push({timestamp: Date.now() , details});
	}

	_emitSkinBombSingle(details) {
		console.log(`[S] Skin bomb single emitted: ${JSON.stringify(details)}`);
	}

	_emitSkinBombMulti(details) {
		console.log(`[M] Skin bomb multi: ${JSON.stringify(details)}`);
	}

	_onAggregationTick() {
		const now = Date.now();
		let playersToRemove = [];

		Utils.objectForEach(this._singleBombQueues, (player, queue) => {
			let numOfExpiredItems = 0;
			for (let i = 0; i < queue.length; i++) {
				if (now - queue[i].timestamp >= SKIN_BOMB_AGGREGATION_PATIENCE) {
					numOfExpiredItems++;
				} else {
					break;
				}
			}

			for (let i = 0; i < numOfExpiredItems; i++) {
				this._emitSkinBombSingle(queue[0].details);
				queue.shift();
			}

			if (queue.length === 0) {
				playersToRemove.push(player);
			}
		});

		for (let player of playersToRemove) {
			delete this._singleBombQueues[player];
		}

		// let indicesToRemove = [];
		// let numOfExpiredItems = 0;
		// let gifters = {};
		// let single_bombs = [];
		// let quinta_bombs = [];
		// for (let i = 0; i < this._singleBombQueue.length; i++) {
		// 	let bomb = this._singleBombQueue[i];
		// 	if (now - bomb.timestamp > SKIN_BOMB_AGGREGATION_PATIENCE) {
		// 		numOfExpiredItems++;
		// 		indicesToRemove.push(i);
		// 	}
		// 	let gifter = bomb.details['player'];
		// 	if (!(gifter in gifters)) {
		// 		gifters[gifter] = [];
		// 	}
		// 	gifters[gifter].push(i);
		// }
		//
		// Utils.objectForEach(gifters, (gifter, indices) => {
		// 	if (indices.length >= 5) {
		//
		// 	}
		// });
	}

	setToken(token) {
		if (token) {
			this._token = token;
			this._updateAPIs();
		} else {
			this.stop();
			this._token = null;
		}
	}

	start() {
		if (this._token === null) {
			Logger.warn("A Stream Raiders token has not been set, so Stream Raiders interaction is disabled.");
			return;
		}

		Object.keys(this.apis).forEach(apiName => {
			this.apis[apiName].start();
		});

		this._singleBombQueues = {};
		TwitchManager.on('message', this._onMessageHandler);
		this._bombAggregationTimer = setInterval(() => this._onAggregationTick(), SKIN_BOMB_AGGREGATION_INTERVAL);
	}

	stop() {
		Object.keys(this.apis).forEach(apiName => {
			this.apis[apiName].stop();
		});

		TwitchManager.removeCallback('message', this._onMessageHandler, true);
		if (this._bombAggregationTimer !== null) {
			clearInterval(this._bombAggregationTimer);
			this._bombAggregationTimer = null;
		}
	}

	mockData() {
		this.apis.skinathon.mockResponses(API_SETTINGS.skinathon.makeMockData(
			this.states.skinathon.startDate,
			this.states.skinathon.totalSkinPoints,
		));
		this.apis.battleBox.mockResponses(API_SETTINGS.battleBox.makeMockData(
			this.states.battle.raid.state,
			this.states.battle.raid.minutes,
			this.states.battle.raid.seconds,
		));
	}

	stopMockingData() {
		Object.keys(this.apis).forEach(apiName => {
			this.apis[apiName].stopMockingResponses();
		});
	}

	log(msg) {
		if (this.logging) {
			Logger.warn(`[StreamRaidersManager] ${msg}`);
		}
	}

	onSkinathonChanged(callback) {
		return this.on('skinathonChanged', callback);
	}

	removeSkinathonChangedCallback(callback) {
		return this.removeCallback('skinathonChanged', callback);
	}

	_notifySkinathonChanged(newState, oldState) {
		this._notify('skinathonChanged', newState, oldState);
		this.log(`skinathonChanged: ${JSON.stringify(oldState)} -> ${JSON.stringify(newState)}`);
	}

	onSkinathonPointsChanged(callback) {
		return this.on('skinathonPointsChanged', callback);
	}

	removeSkinathonPointsChangedCallback(callback) {
		return this.removeCallback('skinathonPointsChanged', callback);
	}

	_notifySkinathonPointsChanged(newPoints, oldPoints) {
		this._notify('skinathonPointsChanged', newPoints, oldPoints);
		this.log(`skinathonPointsChanged: ${oldPoints} -> ${newPoints}`);
	}

	onBattleChanged(callback) {
		return this.on('battleChanged', callback);
	}

	removeBattleChangedCallback(callback) {
		return this.removeCallback('battleChanged', callback);
	}

	_notifyBattleChanged(newState, oldState) {
		this._notify('battleChanged', newState, oldState);
		this.log(`battleChanged: ${JSON.stringify(oldState)} -> ${JSON.stringify(newState)}`);
	}

	onBattleStarted(callback) {
		return this.on('battleStarted', callback);
	}

	removeBattleStartedCallback(callback) {
		return this.removeCallback('battleStarted', callback);
	}

	_notifyBattleStarted() {
		this._notify('battleStarted');
		this.log('battleStarted');
	}

	onBattleEnded(callback) {
		return this.on('battleEnded', callback);
	}

	removeBattleEndedCallback(callback) {
		return this.removeCallback('battleEnded', callback);
	}

	_notifyBattleEnded() {
		this._notify('battleEnded');
		this.log('battleEnded');
	}

	onBattleTimerSync(callback) {
		return this.on('battleTimerSync', callback);
	}

	removeBattleTimerSync(callback) {
		return this.removeCallback('battleTimerSync', callback);
	}

	_notifyBattleTimerSync(minutes, seconds) {
		this._notify('battleTimerSync', minutes, seconds);
		this.log(`battleTimerSync: ${minutes}:${ ("0" + seconds).slice(-2)}`);
	}
}

module.exports = new StreamRaidersManager();


// let oldLog = console.log; let all = []; console.log = (obj) => {all.push(obj); return oldLog(obj)};
