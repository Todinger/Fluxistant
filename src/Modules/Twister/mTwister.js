const Module = requireMain('module');
const ConfigSourceManager = requireMain('configSourceManager');
const StreamRaidersManager = requireMain('streamRaidersManager');
const TwisterLevelEntity = require("./Config/twisterLevelEntity");
const TimedEventQueue = requireMain("timedEventQueue");
const Timers = requireMain('timers');
const { ONE_SECOND, SECONDS } = requireMain('constants');
const Utils = requireMain('utils');


const TWISTER_ACTIVATION_METHODS_SOURCE_NAME = "Twister.ActivationMethods";
const ActivationMethods = {
	SP: "SP Gained",
	Purchases: "Number of Purchases",
	Users: "Unique User Purchases",
}

const NUM_LEVELS = 5;
const EVENT_QUEUE_CHECK_INTERVAL = ONE_SECOND;

const DISPLAY_COOLDOWN_BETWEEN_TORNADOES = 20 * SECONDS;


const TwisterState = {
	Inactive: "Inactive",
	Watch: "Watch",
	Active: "Active",
	Ending: "Ending",
};


const SUPPORTED_SKIN_NAMES = [
	"skinFlagBearerYecatsmailbox",
	"skinFlagBearerYecatsx",
	"skinFullAmazonYecatsx",
	"skinFullArcherYecatsmailbox",
	"skinFullArcherYecatsmailboxHalloween",
	"skinFullArtilleryYecatsx",
	"skinFullBarbarianYecatsmailbox",
	"skinFullBarbarianYecatsmailboxGold",
	"skinFullBarbarianYecatsxSpring23",
	"skinFullBerserkerYecatsx",
	"skinFullBlobYecatsx",
	"skinFullBomberYecatsx",
	"skinFullBusterYecatsX",
	"SkinFullBusterYecatsxHoloP",
	"skinFullCenturionYecatsx",
	"skinFullFairyYecatsx",
	"skinFullFlyingRogueYecatsmailbox",
	"skinFullGladiatorYecatsmailbox",
	"skinFullHealerYecatsx",
	"skinFullLancerYecatsX",
	"skinFullMonkYecatsx",
	"skinFullMusketeerYecatsx",
	"skinFullNecromancerYecatsx",
	"skinFullPaladinYecatsx",
	"skinFullRogueYecatsmailbox",
	"skinFullRogueYecatsmailboxWinter",
	"skinFullSaintYecatsx",
	"skinFullShinobiYecatsx",
	"skinFullShinobiYecatsxFall23",
	"skinFullTankYecatsmailbox",
	"skinFullTemplarYecatsmailbox",
	"skinFullVampireYecatsX",
	"skinFullWarBeastYecatsmailbox",
	"skinFullWarriorYecatsmailbox",
	"skinHeadArcherYecatsmailbox",
	"skinHeadBarbarianYecatsmailbox",
	"skinHeadBerserkerYecatsmailbox",
	"skinHeadBomberYecatsmailbox",
	"skinHeadCenturionYecatsmailbox",
	"skinHeadFlyingRogueYecatsmailbox",
	"skinHeadHealerYecatsmailbox",
	"skinHeadMageYecatsmailbox",
	"skinHeadMonkYecatsmailbox",
	"skinHeadMusketeerYecatsmailbox",
	"skinHeadPaladinYecatsmailbox",
	"skinHeadRogueYecatsmailbox",
	"skinHeadTankYecatsmailbox",
	"skinHeadWarriorYecatsmailbox",
];


class Twister extends Module {
	constructor() {
		super({
			name: 'Twister',
			webname: 'twister',
			source: 'twister.html',
		});

		this.eventQueue = new TimedEventQueue(0, EVENT_QUEUE_CHECK_INTERVAL);
		this.skinPurchaseHandler = (purchaseDetails) => this._skinPurchase(purchaseDetails);
		this.namedSkinPurchaseHandler = (purchaseDetails) => this._namedSkinPurchase(purchaseDetails);

		this.state = TwisterState.Inactive;
		this.stateAfterEnding = TwisterState.Inactive;
		this.levelTimer = Timers.oneShot(() => this.endTornado());
		this.cooldownTimer = Timers.oneShot(() => this._cooldownEnded());

		this.data = {};
	}

	defineModAssets(modData) {
		modData.addNamedCollection('Sounds');
	}

	defineModConfig(modConfig) {
		modConfig.addBoolean('percentageDisplay', false)
			.setName("Percentage Display")
			.setDescription("If checked, display will be displayed in percents; otherwise, current and total SP will be used");
		modConfig.addCustomChoice('activationMethod', {
			source: TWISTER_ACTIVATION_METHODS_SOURCE_NAME,
		})
			.setName('Activation Method')
			.setDescription('How the twister starts');
		modConfig.addInteger('watchThreshold')
			.setName("Watch Threshold")
			.setDescription("The amount for the chosen method (i.e. how much SP / how many (unique) user purchases) needed to start a pre-twister tornado watch");
		modConfig.addInteger('activationThreshold')
			.setName("Activation Threshold")
			.setDescription("The amount for the chosen method (i.e. how much SP / how many (unique) user purchases) needed to start the twister");
		modConfig.addDuration('activationTimeLimit')
			.setName("Activation Time Limit")
			.setDescription("Time window in which the activation threshold must be met in order for the twister to start (set to 0 to disable)");

		let levels = modConfig.addFixedArray('levels', 'TwisterLevel')
			.setName("Twister Levels")
			.setDescription("Settings for the different levels of the twister, from EF1 to EF5");
		for (let i = 0; i < NUM_LEVELS; i++) {
			levels.addElement(new TwisterLevelEntity());
		}

		modConfig.add('backgroundMusic', 'Sound')
			.setName("Background Music")
			.setDescription("Music to be played while the twister is ongoing");
		modConfig.add('warningSound', 'Sound')
			.setName("Warning Sound")
			.setDescription("Sound to be played when the tornado warning flashes");
	}

	enable() {
		this._enableEventHandlers();
		this.eventQueue.start();
	}

	disable() {
		this._disableEventHandlers();
		this.eventQueue.end();
	}

	load() {
		ConfigSourceManager.setSourceOptions(
			TWISTER_ACTIVATION_METHODS_SOURCE_NAME,
			Object.values(ActivationMethods)
		);

		this.onClientAttached(async () => {
			await this._setupClients();
		});
	}

	loadModConfig(conf) {
		if (this.clientsAreConnected) {
			setTimeout(async () => await this._setupClients(), 200);
		}

		this.eventQueue.expirationTime = conf.activationTimeLimit;
		this.eventQueue.clearThresholds();
		this.eventQueue.addThreshold(
			conf.watchThreshold,
			() => this.triggerWatch(),
			() => this.untriggerWatch(),
		);
		this.eventQueue.addThreshold(
			conf.activationThreshold,
			() => this.triggerTornado(),
			() => this.untriggerTornado(),
		);
		if (conf.activationMethod === ActivationMethods.Users) {
			this.eventQueue.setValueCounter(this._countUniqueUsers);
		} else {
			this.eventQueue.clearValueCounter();
		}

		this.eventQueue.expirationTime = conf.activationTimeLimit;
		if (conf.activationTimeLimit > 0) {
			this.eventQueue.start();
		} else {
			this.eventQueue.end();
		}
	}

	get currentLevel() {
		return this.config.levels[this.data.level];
	}


	_enableEventHandlers() {
		StreamRaidersManager.onAnySkinPurchase(this.skinPurchaseHandler);
		StreamRaidersManager.onNamedPurchases(this.namedSkinPurchaseHandler);
	}

	_disableEventHandlers() {
		StreamRaidersManager.removeAnySkinPurchaseCallback(this.skinPurchaseHandler);
		StreamRaidersManager.removeNamedPurchasesCallback(this.namedSkinPurchaseHandler);
	}

	_countUniqueUsers(purchases) {
		let users = [];
		for (let purchaseDetails of purchases) {
			if (!users.includes(purchaseDetails.playerUsername)) {
				users.push(purchaseDetails.playerUsername);
			}
		}

		return users.length;
	}

	_skinPurchase(purchaseDetails) {
		if (this.eventQueue.active) {
			if (this.config.activationMethod === ActivationMethods.SP) {
				this.eventQueue.addEvent(purchaseDetails, purchaseDetails.sp);
			} else if (this.config.activationMethod === ActivationMethods.Purchases) {
				this.eventQueue.addEvent(purchaseDetails);
			} else if (this.config.activationMethod === ActivationMethods.Users) {
				this.eventQueue.addEvent(purchaseDetails);
			}
		}

		if (this.state === TwisterState.Watch || this.state === TwisterState.Active) {
			this._processTornadoPurchaseData(purchaseDetails);
		}
	}

	_namedSkinPurchase(namedPurchases) {
		let skinNames = namedPurchases.map(namedPurchaseDetails => namedPurchaseDetails.skinName);
		this.data.skins.push(...skinNames);
		if (this.state === TwisterState.Active) {
			this.throwIn(skinNames);
		}
	}


	_createNewTornadoData() {
		this.data = {
			level: 0,		// Current tornado level
			sp: 0,			// SP accumulated in current level
			skins: [],		// List of skins added to the tornado so far
			players: {},	// Mapping of player -> SP purchased during tornado
			totalSP: 0,		// Total SP throughout the entire tornado
		};

		this.saveData();
	}

	_ensureTornadoUserData(username) {
		if (!this.data) return;
		if (!(username in this.data.players)) {
			this.data.players[username] = 0;
		}
	}

	_addSkinToTornado(purchaseDetails) {
		// Named purchases are not supported right now - ALL SKINS ARE RANDOM!
		// if (purchaseDetails.skinName in SUPPORTED_SKIN_NAMES) {
		// 	skinName = purchaseDetails.skinName;
		// } else {
		// 	skinName = Utils.randomElement(SUPPORTED_SKIN_NAMES);
		// }

		let amount = purchaseDetails.amount;
		if (!amount) {
			amount = 1;
		}

		let skinNames = [];
		for (let i = 0; i < amount; i++) {
			let skinName = Utils.randomElement(SUPPORTED_SKIN_NAMES);
			skinNames.push(skinName);
			this.data.skins.push(skinName);
		}

		if (this.state === TwisterState.Active) {
			this.throwIn(skinNames);
		}
	}

	_increaseLevel() {
		let levelsGained = 0;
		while (this.data.level < NUM_LEVELS - 1 && this.data.sp >= this.currentLevel.spToClear) {
			this.data.sp -= this.currentLevel.spToClear;
			this.data.level++;
			levelsGained++;
		}

		if (levelsGained > 0) {
			this._resetLevelTimer();
		}

		return levelsGained;
	}

	_addPurchaseDetailsToData(purchaseDetails) {
		this._ensureTornadoUserData(purchaseDetails.playerUsername);
		this.data.players[purchaseDetails.playerUsername] += purchaseDetails.sp;
		this._addSkinToTornado(purchaseDetails);
		this.data.sp += purchaseDetails.sp;
		this.data.totalSP += purchaseDetails.sp;
	}

	_addPurchasesToTornado(listOfPurchaseDetails) {
		let levelsGained = 0;
		for (let purchaseDetails of listOfPurchaseDetails) {
			this._addPurchaseDetailsToData(purchaseDetails);
			levelsGained += this._increaseLevel();
		}

		this.saveData();

		if (levelsGained) {
			this.grow(levelsGained);
		} else {
			this.sendProgress();
		}
	}

	_processTornadoPurchaseData(purchaseDetails) {
		if (this.state !== TwisterState.Watch && this.state !== TwisterState.Active) return;

		this._addPurchasesToTornado([purchaseDetails]);
	}


	triggerWatch() {
		if (this.state === TwisterState.Inactive) {
			this.startWatch();
		} else if (this.state === TwisterState.Ending) {
			this.stateAfterEnding = TwisterState.Watch;
		}
	}

	startWatch(includeLastEvent = false) {
		this.state = TwisterState.Watch;
		this._createNewTornadoData();

		let purchaseEvents = this.eventQueue.events;
		if (!includeLastEvent) {
			// Removing the last one because it'll be handled separately by the last part of _skinPurchase
			// (which should run shortly after this)
			purchaseEvents = purchaseEvents.slice(0, purchaseEvents.length - 1);
		}

		this._addPurchasesToTornado(purchaseEvents);

		this.broadcastEvent("watch");
	}

	untriggerWatch() {
		if (this.state === TwisterState.Watch) {
			this.stopWatch();
		} else if (this.state === TwisterState.Ending) {
			this.stateAfterEnding = TwisterState.Inactive;
		}
	}

	stopWatch() {
		if (this.state !== TwisterState.Watch) return;

		this.state = TwisterState.Inactive;
		this.hide();
	}

	triggerTornado() {
		if (this.state === TwisterState.Watch) {
			this.startTornado();
		} else if (this.state === TwisterState.Ending) {
			this.stateAfterEnding = TwisterState.Active;
		}
	}

	startTornado() {
		this.eventQueue.end();
		this.broadcastEvent("startTornado", {
			duration: this.config.levels[0].timeLimit,
			progress: this._makeProgress(),
		});
		setTimeout(() => this._tornadoStarted(), 6 * SECONDS);
	}

	untriggerTornado() {
		if (this.state === TwisterState.Inactive) {
			this.stateAfterEnding = TwisterState.Watch;
		}
	}

	_cooldownEnded() {
		this.state = TwisterState.Inactive;
		if (this.stateAfterEnding === TwisterState.Watch) {
			this.startWatch(true);
		} else if (this.stateAfterEnding === TwisterState.Active) {
			this.startWatch(true);
			this.startTornado();
		}

		this.stateAfterEnding = TwisterState.Inactive;
	}

	_resetLevelTimer() {
		this.levelTimer.set(this.currentLevel.timeLimit * SECONDS);
	}

	_tornadoStarted() {
		this.state = TwisterState.Active;
		this._resetLevelTimer();
		this.broadcastEvent("throwIn", this.data.skins);
	}

	_makeProgress() {
		let currentSP = this.data.sp;
		let maxSP = this.currentLevel.spToClear;
		let allowOverflow = this.data.level === NUM_LEVELS - 1;
		if (this.config.percentageDisplay) {
			return {
				percentage: 100 * currentSP / maxSP,
				allowOverflow,
			};
		} else {
			return {
				currentSP,
				maxSP,
				allowOverflow,
			};
		}
	}

	throwIn(skinNames) {
		this.broadcastEvent("throwIn", skinNames);
	}

	sendProgress() {
		this.broadcastEvent("setProgress", this._makeProgress());
	}

	forceGrow() {
		if (this.state !== TwisterState.Active || this.data.level >= MAX_TORNADO_LEVEL - 1) {
			return false;
		}

		this.data.level++;
		this.data.sp = 0;
		this.grow(1);
	}

	grow(levels) {
		this.broadcastEvent("grow", {
			levels,
			duration: this.currentLevel.timeLimit,
			progress: this._makeProgress(),
		});
	}

	hide() {
		this.broadcastEvent("hide");
	}

	endTornado() {
		this.state = TwisterState.Ending;
		this.stateAfterEnding = TwisterState.Inactive;
		this.eventQueue.start();
		this.broadcastEvent("endTornado");

		this.cooldownTimer.set(DISPLAY_COOLDOWN_BETWEEN_TORNADOES);
	}

	async _setupClients() {
		let bgmConf = this.config.backgroundMusic;
		let setupData = {};
		if (bgmConf && bgmConf.file.fileKey) {
			let soundFileConf = bgmConf.file;
			let soundFile = await this.assets.getFileWeb(soundFileConf);
			setupData.bgm = bgmConf.makeDisplayData(soundFile);
		}

		let warningSoundConf = this.config.warningSound;
		if (warningSoundConf && warningSoundConf.file.fileKey) {
			let warningSoundFileConf = warningSoundConf.file;
			let soundFile = await this.assets.getFileWeb(warningSoundFileConf);
			setupData.warningSound = warningSoundConf.makeDisplayData(soundFile);
		}

		this.broadcastEvent("setup", setupData);
	}

	// broadcastEvent(event, ...p) {
	// 	this.print(`Event: ${event}`);
	// 	super.broadcastEvent(event, ...p);
	// }


	functions = {
		// startGame: {
		// 	name: 'Start Game',
		// 	description: 'Start a new game',
		// 	action: data => this.start(data),
		// },
		// stopGame: {
		// 	name: 'Stop Game',
		// 	description: "Stop the game if it's running",
		// 	action: () => this.stop(),
		// },
		forceWatch: {
			name: 'Force Watch',
			description: "Starts the Tornado Watch directly (doesn't work if the tornado is already active)",
			triggers: [
				this.trigger.cli({
					cmdname: 'twatch',
				}),
			],
			action: () => this.startWatch(),
		},
		start: {
			name: 'Force Start',
			description: "Starts the Tornado itself directly (doesn't work if the tornado is already active)",
			triggers: [
				this.trigger.cli({
					cmdname: 'tstart',
				}),
			],
			action: () => this.startTornado(),
		},
		grow: {
			name: 'Force Grow',
			description: "Grows the Tornado level immediately (doesn't work if the tornado is already active)",
			triggers: [
				this.trigger.cli({
					cmdname: 'tgrow',
				}),
			],
			action: () => this.forceGrow(),
		},
	}
}

module.exports = new Twister();
