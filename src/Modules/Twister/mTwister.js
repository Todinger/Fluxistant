const Module = requireMain('module');
const ConfigSourceManager = requireMain('configSourceManager');
const StreamRaidersManager = requireMain('streamRaidersManager');
const TwisterLevelEntity = require("./Config/twisterLevelEntity");
const TimedEventQueue = requireMain("timedEventQueue");


const TWISTER_ACTIVATION_METHODS_SOURCE_NAME = "Twister.ActivationMethods";
const ActivationMethods = {
	SP: "SP Gained",
	Purchases: "Number of Purchases",
	Users: "Unique User Purchases",
}

const NUM_LEVELS = 5;
const EVENT_QUEUE_CHECK_INTERVAL = 1000;


const TwisterState = {
	Inactive: "Inactive",
	Watch: "Watch",
	Active: "Active",
	Ending: "Ending",
};


class Twister extends Module {
	constructor() {
		super({
			name: 'Twister',
			webname: 'twister',
			source: 'twister.html',
		});

		this.eventQueue = new TimedEventQueue(0, EVENT_QUEUE_CHECK_INTERVAL);
		this.skinPurchaseHandler = (purchaseDetails) => this._skinPurchase(purchaseDetails);

		this.state = TwisterState.Inactive;

		this.data = {};
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
	}

	loadModConfig(conf) {
		this.eventQueue.expirationTime = conf.activationTimeLimit;
		this.eventQueue.clearThresholds();
		this.eventQueue.addThreshold(conf.watchThreshold, () => this.startWatch());
		this.eventQueue.addThreshold(conf.activationThreshold, () => this.startTornado());
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


	_enableEventHandlers() {
		StreamRaidersManager.onAnySkinPurchase(this.skinPurchaseHandler);
	}

	_disableEventHandlers() {
		StreamRaidersManager.removeAnySkinPurchaseCallback(this.skinPurchaseHandler);
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
		if (this.config.activationMethod === ActivationMethods.SP) {
			this.eventQueue.addEvent(purchaseDetails, purchaseDetails.sp);
		} else if (this.config.activationMethod === ActivationMethods.Purchases) {
			this.eventQueue.addEvent(purchaseDetails);
		} else if (this.config.activationMethod === ActivationMethods.Users) {
			this.eventQueue.addEvent(purchaseDetails);
		}
	}


	startWatch() {
		this.state = TwisterState.Watch;
		this.broadcastEvent("watch");
	}

	startTornado() {
		this.state = TwisterState.Active;
		this.eventQueue.end();
		this.broadcastEvent("startTornado", 20);
	}

	grow() {
		this.broadcastEvent("grow", 20);
	}


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
			action: () => this.grow(),
		},
	}
}

module.exports = new Twister();
