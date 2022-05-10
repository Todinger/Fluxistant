const Module = requireMain('module');
const Utils = requireMain('utils');
const CONSTANTS = requireMain('constants');

const PLACEHOLDERS = {
	USER: '$user',
	CATCHES: '$caught',
	NORMALS: '$normals',
	SHINIES: '$shinies',
};

const SHINY_CATCHERS_MESSAGE_PREFIX = "✨ You gotta be kitten me! Look who caught a rare shiny Yecats! ✨ ";

class Pokyecats extends Module {
	constructor() {
		super({
			name: 'Pokyecats',
		});
		
		this.data.catches = {};
		this.catchChance = 0;
		this.shinyChance = 0;
	}
	
	defineModConfig(modConfig) {
		modConfig.addPercentageNumber('catchChance', 20)
			.setName('Catch Chance')
			.setDescription('The odds of catching Yecats (0-100)');
		modConfig.addPercentageNumber('shinyChance', 5)
			.setName('Shiny Chance')
			.setDescription('The odds of Yecats being shiny *if caught* (0-100)');
		modConfig.addString('normalCatchMessage', "You caught a Yecats! That's $caught so far!")
			.setName('Catch Message: Normal')
			.setDescription('Message to send when a *non-shiny* Yecats is caught and no past shinies have been caught ' +
							'($user = user name, $caught = total)');
		modConfig.addString('missMessage', "Aww, you missed her! You're still at $caught so far.")
			.setName('Miss Message')
			.setDescription('Message to send when failed to catch Yecats and no past shinies have been caught ' +
							'($user = user name, $caught = total)');
		modConfig.addString('normalCatchMessageWithShinies', "You caught a Yecats! That's $caught so far: $normals Yecats(es) and $shinies SHINY Yecats(es)!")
			.setName('Catch Message: Normal (Had Shinies)')
			.setDescription('Message to send when a *non-shiny* Yecats is caught and shinies have been caught before ' +
							'($user = user name, $caught = total, $normals = normal catches, $shinies = shiny catches)');
		modConfig.addString('missMessageWithShinies', "Aww, you missed her! You're still at $caught: $normals Yecats(es) and $shinies SHINY Yecats(es).")
			.setName('Miss Message (Had Shinies)')
			.setDescription('Message to send when failed to catch Yecats and shinies have been caught before ' +
							'($user = user name, $caught = total, $normals = normal catches, $shinies = shiny catches)');
		modConfig.addString('shinyCatchMessage', "YOU CAUGHT A SHINY YECATS! :O That's $caught in total: $normals Yecats(es) and $shinies SHINY Yecats(es)!")
			.setName('Catch Message: Shiny')
			.setDescription('Message to send when a *shiny* Yecats is caught ' +
							'($user = user name, $caught = total, $normals = normal catches, $shinies = shiny catches)');
	}
	
	loadModConfig(conf) {
		this.catchChance = conf.catchChance / 100;
		this.shinyChance = conf.shinyChance / 100;
	}
	
	newCatchData() {
		return {
			catches: 0,
			shinyCatches: 0,
			displayName: '',
		};
	}
	
	getUserCatchData(user) {
		return this.data.catches[user.name] || this.newCatchData();
	}
	
	variableValuesFromCatchData(catchData) {
		return {
			catches: catchData.catches,
			shinyCatches: catchData.shinyCatches,
			normalCatches: catchData.catches - catchData.shinyCatches,
		};
	}
	
	tellMessage(user, message, catchData) {
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.USER, user.displayName);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.CATCHES, catchData.catches);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.SHINIES, catchData.shinyCatches);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.NORMALS, catchData.catches - catchData.shinyCatches);
		this.tell(user, message);
	}
	
	tryCatch(data) {
		let catchData = this.getUserCatchData(data.user);
		
		// Caught only if the result is < catch chance
		if (Math.random() >= this.catchChance) {
			if (catchData.shinyCatches > 0) {
				this.tellMessage(data.user, this.config.missMessageWithShinies, catchData);
			} else {
				this.tellMessage(data.user, this.config.missMessage, catchData);
			}
			
			return {
				success:   false,
				variables: this.variableValuesFromCatchData(catchData),
			};
		}
		
		catchData.catches++;
		
		if (Math.random() < this.shinyChance) {
			catchData.shinyCatches++;
			this.tellMessage(data.user, this.config.shinyCatchMessage, catchData);
		} else if (catchData.shinyCatches > 0) {
			this.tellMessage(data.user, this.config.normalCatchMessageWithShinies, catchData);
		} else {
			this.tellMessage(data.user, this.config.normalCatchMessage, catchData);
		}
		
		this.data.catches[data.user.name] = catchData;
		this.data.catches[data.user.name].displayName = data.user.displayName;
		
		this.saveData();
		
		return {
			success:   true,
			variables: this.variableValuesFromCatchData(catchData),
		};
	}
	
	getCatches(data) {
		let catchData = this.getUserCatchData(data.user);
		return {
			success:   true,
			variables: this.variableValuesFromCatchData(catchData),
		};
	}
	
	listShinyCatchers(data) {
		let shinyCatchers = Object.keys(this.data.catches)
			.filter(name => this.data.catches[name].shinyCatches > 0)
			.map(name => ({ name: this.data.catches[name].displayName, count: this.data.catches[name].shinyCatches }));
		if (shinyCatchers.length === 0) {
			this.tell(data.user, "Aww, nobody has caught a shiny Yecats yet. =(");
			return;
		}
		
		let message = SHINY_CATCHERS_MESSAGE_PREFIX + `${shinyCatchers[0].name}: ${shinyCatchers[0].count}`;
		let i = 1;
		while (i < shinyCatchers.length) {
			let extendedMessage = `${message}, ${shinyCatchers[i].name}: ${shinyCatchers[i].count}`;
			if (extendedMessage.length >= CONSTANTS.TWITCH.MAX_MESSAGE_LENGTH) {
				this.say(message);
				message = `${shinyCatchers[i].name}: ${shinyCatchers[i].count}`;
			} else {
				message = extendedMessage;
			}
			
			i++;
		}
		
		this.say(message);
	}
	
	functions = {
		sellSoul: {
			name: 'Try Catch',
			description: 'Try catching Yecats',
			triggers: [
				this.trigger.command({
					cmdname: 'pokyecats',
				}),
			],
			action: data => this.tryCatch(data),
		},
		
		getCatches: {
			name: 'Get Catches',
			description: 'Give a report of the Yecatses caught so far',
			action: () => this.getCatches(),
		},
		
		listShinyCatchers: {
			name: 'List Shiny Catchers',
			description: "Send a list to the chat of everyone who's caught a shiny Yecats",
			triggers: [
				this.trigger.command({
					cmdname: 'shinyecats',
				}),
			],
			action: (data) => this.listShinyCatchers(data),
		},
	}
}

module.exports = new Pokyecats();
