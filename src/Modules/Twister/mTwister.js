const Module = requireMain('module');
const ConfigSourceManager = requireMain('configSourceManager');
const Prizes = require('./prizes');
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

const DISPLAY_COOLDOWN_BETWEEN_TORNADOES = 50 * SECONDS;


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


function range(min, max) {
	return {
		weight: 1,
		min,
		max: max || min,
	};
}

// function wRange(weight, min, max) {
// 	return {
// 		weight,
// 		min,
// 		max: max || min,
// 	};
// }

function lRange(limit, min, max) {
	return {
		weight: 1,
		min,
		max: max || min,
		limit,
	}
}

// function cRange(limit, weight, min, max) {
// 	return {
// 		weight,
// 		min,
// 		max: max || min,
// 		limit,
// 	}
// }


const PRIZE_OPTIONS = [
	// EF 1
	{
		main: null,  // No rewards unless level 1 is completed
		consolation: {
			yarn: range(5, 10),
			yarnBall: range(1),
		},
	},
	// EF 2
	{
		main: {
			randomYippie: {tier: 0},
		},
		consolation: {
			yarn: range(10, 20),
			yarnBall: range(2, 4),
			goldBall: range(1),
		},
	},
	// EF 3
	{
		main: {
			randomYippie: {tier: 1},
		},
		consolation: {
			yarn: range(21, 30),
			yarnBall: range(6, 8),
			goldBall: range(2),
		},
	},
	// EF 4
	{
		main: {
			randomYippie: {tier: 2},
		},
		consolation: {
			yarn: range(31, 45),
			yarnBall: range(10, 15),
			goldBall: range(3),
			catches: range(1, 2),
		},
	},
	// EF 5
	{
		main: {
			randomYippie: {tier: 3},
		},
		consolation: {
			yarn: range(50, 75),
			yarnBall: range(20, 30),
			goldBall: range(5),
			catches: range(3, 5),
		},
	},
	// EF 5 CLEARED
	{
		main: {
			randomYippie: {tier: 4},
		},
		consolation: {
			yarn: range(76, 100),
			yarnBall: range(35, 50),
			goldBall: range(3, 7),
			catches: range(4, 6),
			shinyCatches: lRange(3, 1),
		},
	},
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

		this.prizes = {
			yarn: Prizes.pokyecats.yarn(this),
			yarnBall: Prizes.pokyecats.yarnBall(this),
			goldBall: Prizes.pokyecats.goldBall(this),
			catches: Prizes.pokyecats.catches(this),
			shinyCatches: Prizes.pokyecats.shinyCatches(this),
			randomYippie: Prizes.yippies.randomTiered(this),
		};

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

	defineModDependencies() {
		this.pokyecats = this.use('Pokyecats');
		this.yippies = this.use('Yippies');
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

	_ensureTornadoUserData(username, displayName) {
		if (!this.data) return;
		if (!(username in this.data.players)) {
			this.data.players[username] = {
				displayName,
				sp: 0,
			};
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
		this._ensureTornadoUserData(purchaseDetails.playerUsername, purchaseDetails.player);
		this.data.players[purchaseDetails.playerUsername].sp += purchaseDetails.sp;
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
			this.eventQueue.pauseClearing();
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

	_announceResults() {
		let efLevel = this.data.level + 1;
		let maxSP = 0, mvps = [];
		Object.values(this.data.players).forEach(({displayName, sp}) => {
			if (sp > maxSP) {
				mvps = [displayName];
				maxSP = sp;
			} else if (sp === maxSP) {
				mvps.push(displayName);
			}
		});

		if (mvps.length === 1) {
			this.print(`Phew! The tornado, rated EF${efLevel} is over! Stormchaser ${mvps[0]} contributed the most with ${maxSP} SP! The tornado left debris all over!`);
		} else {
			this.print(`Phew! The tornado, rated EF${efLevel} is over! Stormchasers ${Utils.makeEnglishAndList(mvps)} contributed the most with ${maxSP} SP! The tornado left debris all over!`);
		}
	}

	_cooldownEnded() {
		this._announceResults();

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

		this.grantPrizes().then().catch();
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

	async _grantConsolationPrize(limitedPrizesGiven, username, displayName) {
		let level = this.data.level;
		if (level === NUM_LEVELS - 1 && this.data.sp >= this.currentLevel.spToClear) {
			level++;
		}

		let options = PRIZE_OPTIONS[level].consolation;
		let selection = Utils.weightedRandomKey(options, (name, values) => {
			if (name in limitedPrizesGiven && limitedPrizesGiven[name] >= values.limit) {
				return 0;
			}

			return values.weight;
		});

		if (options[selection].limit !== undefined) {
			limitedPrizesGiven[selection] = (limitedPrizesGiven[selection] || 0) + 1;
		}

		let prize = this.prizes[selection];
		return await prize.grant(username, displayName, options[selection]);
	}

	async _grantMainPrize(username, displayName) {
		let level = this.data.level;
		if (level === NUM_LEVELS - 1 && this.data.sp >= this.currentLevel.spToClear) {
			level++;
		}

		let options = PRIZE_OPTIONS[level].main;
		if (!options) {
			return false;
		}

		let selection = Utils.randomKey(options);

		let prize = this.prizes[selection];
		return await prize.grant(username, displayName, options[selection]);
	}

	_formatPrizeHTML(prize) {
		let html = `<span class="${prize.quality}">${prize.html}</span>`;
		if (prize.imageURL) {
			html += ` <img src="${prize.imageURL}" alt="" class="prize-image">`;
		}
		return html;
	}

	async grantPrizes() {
		let prizes = {};
		this.print("+--------+");
		this.print("| PRIZES |");
		this.print("+--------+");
		let htmlEntries = [];
		let limitedPrizesGiven = {};
		await Utils.objectForEachAsync(this.data.players, async (username, userDetails) => {
			const displayName = userDetails.displayName;
			let mainPrize = await this._grantMainPrize(username, displayName);
			let consolationPrize = await this._grantConsolationPrize(limitedPrizesGiven, username, displayName);
			let text, html;
			let consolationPrizeHtml = this._formatPrizeHTML(consolationPrize);

			if (mainPrize) {
				text = `${displayName} got ${mainPrize.text} and ${consolationPrize.text}`;
				let mainPrizeHtml = this._formatPrizeHTML(mainPrize);
				html = `<span class="username">${displayName}</span> got ${mainPrizeHtml} and ${consolationPrizeHtml}`;
			} else {
				text = `${displayName} got ${consolationPrize.text}`;
				html = `<span class="username">${displayName}</span> got ${consolationPrizeHtml}`;
			}

			this.print(text);

			htmlEntries.push(html);
			prizes[username] = {main: mainPrize, consolation: consolationPrize};
		});

		setTimeout(() => this.saveAllData(true), 500);
		this.broadcastEvent("showPrizes", htmlEntries);

		return prizes;
	}

	hidePrizes() {
		this.broadcastEvent("hidePrizes");
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
		hidePrizes: {
			name: 'Hide Prizes',
			description: "Hides the prize list shown after a tornado on the screen",
			triggers: [
				this.trigger.cli({
					cmdname: 'hide',
				}),
			],
			action: () => this.hidePrizes(),
		},
	}
}

module.exports = new Twister();
