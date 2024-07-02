'use strict';
const EventNotifier = require('./eventNotifier');
const Globals = require('./globals');
const Logger = require('./logger');
const cli = require('./cliManager');
const TwitchManager = require('./twitchManager');
const Utils = require('./utils');
const { SECONDS, ONE_SECOND } = require('./constants');
const {
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
} = require('./streamRaidersInfra');

// Twitch username regex: /[a-zA-Z0-9][\w]{2,24}/

const SKIN_BOMB_AGGREGATION_PATIENCE = 5 * SECONDS;
const SKIN_BOMB_AGGREGATION_INTERVAL = ONE_SECOND;


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

		this.active = false;
		this._token = null;

		this.states = {
			skinathon: new SkinathonState(),
			battle: new BattleState(),
		};

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
		};

		this.apiResponseContentTests = {
			skinathon: (data) => data && data['data'] && data['data'].startDate !== null,
			battleBox: (data) => data && data['data'] && (
				data['data'].units.length > 0 ||
				data['data'].epics.length > 0 ||
				data['data'].purchases.length > 0 ||
				data['data'].gifts.length > 0 ||
				data['data'].skins.length > 0
			),
		};

		this._addEvent('skinathonStarted');
		this._addEvent('skinathonChanged');
		this._addEvent('skinathonPointsChanged');
		this._addEvent('battleChanged');
		this._addEvent('battleStarted');
		this._addEvent('battleEnded');
		this._addEvent('battleTimerSync');
		this._addEvent('anySkinPurchase');
		this._addEvent('singleSkinPurchase');
		this._addEvent('skinGift');
		this._addEvent('singleSkinBomb');
		this._addEvent('multiSkinBomb');
		this._addEvent('namedPurchases');


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

		this.logging = false;
		this.errorLogging = true;

		// When activated, the streamer's messages are used instead of the CaptainTV bot
		this.testMode = true;

		this.processedNamedPurchasesIDs = [];
	}

	_apiError(apiName, err) {
		if (this.errorLogging) {
			Logger.warn(`[StreamRaidersManager] Error in ${apiName} API: ${err}`);
		}
	}

	_updateSkinathonState(data) {
		if (this.apiResponseContentTests.skinathon(data)) {
			this.log(`<Skinathon API> ${JSON.stringify(data)}`);
		}

		if (!this.states.skinathon.represents(data['data'])) {
			let oldState = this.states.skinathon;
			let newState = this.states.skinathon = new SkinathonState(data['data']);
			if (!oldState.isActive && newState.isActive) {
				this._notifySkinathonStarted(newState);
			} else {
				this._notifySkinathonChanged(newState, oldState);
			}

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
		if (this.apiResponseContentTests.battleBox(data)) {
			this.log(`<BattleBox API> ${JSON.stringify(data)}`);
		}
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
		const chatEventSourceUsername = this.testMode ? Globals.StreamerUser.name : CTV_BOT_USER;
		if (user.name !== chatEventSourceUsername) return;

		let match = null;
		for (let handlerDesc of this._messageHandlers) {
			match = handlerDesc.regex.exec(message);
			if (match) {
				// Skip false positive that recognizes part of a skin name as the captain name
				// (e.g. "Flag Bearer" would be recognized as "Flag" being the captain and "Bearer"
				// being the skin)
				let captain = match.groups['captain'];
				if (captain) {
					captain = captain.toLowerCase();
					let streamer = Globals.StreamerUser.name.toLowerCase();
					let allowedNames = [streamer, "yecatsx", "yecatsmailbox"];
					if (!allowedNames.includes(captain)) continue;
				}

				handlerDesc.handler(match.groups);
				return;
			}
		}
	}

	_checkNamedPurchasesInText(text) {
		let namedPurchases = [];
		for (match of text.matchAll(NAMED_PURCHASE_REGEX)) {
			if (!this.processedNamedPurchasesIDs.includes(match.groups['eventId'])) {
				namedPurchases.push(new NamedPurchase(match.groups));
				this.processedNamedPurchasesIDs.push(match.groups['eventId']);
			}
		}

		this._emitNamedSkinPurchases(namedPurchases);
	}

	_emitNamedSkinPurchases(namedPurchases) {
		if (namedPurchases.length > 0) {
			this._notifyNamedPurchases(namedPurchases);
		}
	}

	_emitSkinPurchase(details) {
		console.log(`Skin purchase: ${JSON.stringify(details)}`);
		const purchaseDetails = new SkinPurchaseDetails(details);
		this._notifySingleSkinPurchase(purchaseDetails);
		this._notifyAnySkinPurchase(purchaseDetails);
	}

	_emitSkinGifted(details) {
		console.log(`Skin gift: ${JSON.stringify(details)}`);
		const purchaseDetails = new SkinGiftDetails(details);
		this._notifySkinGift(purchaseDetails);
		this._notifyAnySkinPurchase(purchaseDetails);
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
		const purchaseDetails = new SkinBombSingleDetails(details);
		this._notifySingleSkinBomb(purchaseDetails);
		this._notifyMultiSkinBomb(new SkinBombMultiDetails({
			player: purchaseDetails.player,
			captain: purchaseDetails.captain,
			amount: 1,
		}));
		this._notifyAnySkinPurchase(purchaseDetails);
	}

	_emitSkinBombMulti(details) {
		console.log(`[M] Skin bomb multi: ${JSON.stringify(details)}`);
		const purchaseDetails = new SkinBombMultiDetails(details);
		this._notifyMultiSkinBomb(purchaseDetails);
		this._notifyAnySkinPurchase(purchaseDetails);
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
	}

	applyConfig(srSettings) {
		this.setToken(srSettings.token);
		this.logging = srSettings.logging;
		this.testMode = srSettings.testMode;
		if (srSettings.enabled) {
			this.start();
		} else {
			this.stop();
		}
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
		if (this.active) return;

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

		this.active = true;
	}

	stop() {
		if (!this.active) return;

		Object.keys(this.apis).forEach(apiName => {
			this.apis[apiName].stop();
		});

		TwitchManager.removeCallback('message', this._onMessageHandler, true);
		if (this._bombAggregationTimer !== null) {
			clearInterval(this._bombAggregationTimer);
			this._bombAggregationTimer = null;
		}

		this.active = false;
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
			Logger.info(`[StreamRaidersManager] ${msg}`);
		}
	}

	onSkinathonStarted(callback) {
		return this.on('skinathonStarted', callback);
	}

	removeSkinathonStartedCallback(callback) {
		return this.removeCallback('skinathonStarted', callback);
	}

	_notifySkinathonStarted(skinathonState) {
		this._notify('skinathonStarted', skinathonState);
	}

	onSkinathonChanged(callback) {
		return this.on('skinathonChanged', callback);
	}

	removeSkinathonChangedCallback(callback) {
		return this.removeCallback('skinathonChanged', callback);
	}

	_notifySkinathonChanged(newState, oldState) {
		this._notify('skinathonChanged', newState, oldState);
		// this.log(`skinathonChanged: ${JSON.stringify(oldState)} -> ${JSON.stringify(newState)}`);
	}

	onSkinathonPointsChanged(callback) {
		return this.on('skinathonPointsChanged', callback);
	}

	removeSkinathonPointsChangedCallback(callback) {
		return this.removeCallback('skinathonPointsChanged', callback);
	}

	_notifySkinathonPointsChanged(newPoints, oldPoints) {
		this._notify('skinathonPointsChanged', newPoints, oldPoints);
		// this.log(`skinathonPointsChanged: ${oldPoints} -> ${newPoints}`);
	}

	onBattleChanged(callback) {
		return this.on('battleChanged', callback);
	}

	removeBattleChangedCallback(callback) {
		return this.removeCallback('battleChanged', callback);
	}

	_notifyBattleChanged(newState, oldState) {
		this._notify('battleChanged', newState, oldState);
		// this.log(`battleChanged: ${JSON.stringify(oldState)} -> ${JSON.stringify(newState)}`);
	}

	onBattleStarted(callback) {
		return this.on('battleStarted', callback);
	}

	removeBattleStartedCallback(callback) {
		return this.removeCallback('battleStarted', callback);
	}

	_notifyBattleStarted() {
		this._notify('battleStarted');
		// this.log('battleStarted');
	}

	onBattleEnded(callback) {
		return this.on('battleEnded', callback);
	}

	removeBattleEndedCallback(callback) {
		return this.removeCallback('battleEnded', callback);
	}

	_notifyBattleEnded() {
		this._notify('battleEnded');
		// this.log('battleEnded');
	}

	onBattleTimerSync(callback) {
		return this.on('battleTimerSync', callback);
	}

	removeBattleTimerSync(callback) {
		return this.removeCallback('battleTimerSync', callback);
	}

	_notifyBattleTimerSync(minutes, seconds) {
		this._notify('battleTimerSync', minutes, seconds);
		// this.log(`battleTimerSync: ${minutes}:${ ("0" + seconds).slice(-2)}`);
	}

	onAnySkinPurchase(callback) {
		return this.on('anySkinPurchase', callback);
	}

	removeAnySkinPurchaseCallback(callback) {
		return this.removeCallback('anySkinPurchase', callback);
	}

	_notifyAnySkinPurchase(details) {
		this._notify('anySkinPurchase', details);
	}

	onSingleSkinPurchase(callback) {
		return this.on('singleSkinPurchase', callback);
	}

	removeSingleSkinPurchaseCallback(callback) {
		return this.removeCallback('singleSkinPurchase', callback);
	}

	_notifySingleSkinPurchase(details) {
		this._notify('singleSkinPurchase', details);
	}

	onSkinGift(callback) {
		return this.on('skinGift', callback);
	}

	removeSkinGiftCallback(callback) {
		return this.removeCallback('skinGift', callback);
	}

	_notifySkinGift(details) {
		this._notify('skinGift', details);
	}

	onSingleSkinBomb(callback) {
		return this.on('singleSkinBomb', callback);
	}

	removeSingleSkinBombCallback(callback) {
		return this.removeCallback('singleSkinBomb', callback);
	}

	_notifySingleSkinBomb(details) {
		this._notify('singleSkinBomb', details);
	}

	onMultiSkinBomb(callback) {
		return this.on('multiSkinBomb', callback);
	}

	removeMultiSkinBombCallback(callback) {
		return this.removeCallback('multiSkinBomb', callback);
	}

	_notifyMultiSkinBomb(details) {
		this._notify('multiSkinBomb', details);
	}

	onNamedPurchases(callback) {
		return this.on('namedPurchases', callback);
	}

	removeNamedPurchasesCallback(callback) {
		return this.removeCallback('namedPurchases', callback);
	}

	_notifyNamedPurchases(namedPurchases) {
		this._notify('namedPurchases', namedPurchases);
	}
}

module.exports = new StreamRaidersManager();


// let oldLog = console.log; let all = []; console.log = (obj) => {all.push(obj); return oldLog(obj)};
