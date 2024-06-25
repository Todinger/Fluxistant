const Module = requireMain('module');
const TwisterLevelEntity = require("./Config/twisterLevelEntity");
const ConfigSourceManager = requireMain('configSourceManager');


const TWISTER_ACTIVATION_METHODS_SOURCE_NAME = "Twister.ActivationMethods";
const ActivationMethods = {
	SP: "SP Gained",
	Purchases: "Number of Purchases",
	Users: "Unique User Purchases",
}

const NUM_LEVELS = 5;


class Twister extends Module {
	constructor() {
		super({
			name: 'Twister',
			webname: 'twister',
			source: 'twister.html',
		});

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

	load() {
		ConfigSourceManager.setSourceOptions(
			TWISTER_ACTIVATION_METHODS_SOURCE_NAME,
			Object.values(ActivationMethods)
		);
	}

	startWatch() {
		this.broadcastEvent("watch");
	}

	startTornado() {
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
		watch: {
			name: 'Watch',
			description: "Tornado Watch!",
			triggers: [
				this.trigger.cli({
					cmdname: 'twatch',
				}),
			],
			action: () => this.startWatch(),
		},
		start: {
			name: 'Start',
			description: "Tornado!!!",
			triggers: [
				this.trigger.cli({
					cmdname: 'tstart',
				}),
			],
			action: () => this.startTornado(),
		},
		grow: {
			name: 'Grow',
			description: "Grow!",
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
