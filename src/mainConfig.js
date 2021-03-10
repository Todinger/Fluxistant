const Configuration = require('./configuration');

const DEFAULT_PORT = 3333;

class MainConfig extends Configuration {
	constructor() {
		super('main');
		this.addInteger('port', DEFAULT_PORT)
			.setName('Port')
			.setDescription('Server port to listen on');
		// this.addString('streamerName')
		// 	.setName('Streamer Name')
		// 	.setDescription('How the bot addresses you in the chat when it does (for whatever reason...)');
		this.addNaturalNumber('configBackupLimit', 100)
			.setName('# of Config Backups')
			.setDescription('How many previous good configurations should be saved as backup.');
		
		let twitch = this.addGroup('twitch')
			.setName('Twitch')
			.setDescription("Settings for your and your bot's Twitch accounts");
		twitch.addString('channel')
			.setName('Channel Name')
			.setDescription('Name of your channel (the one the bot is going to interact with)');
		twitch.addString('botname')
			.setName('Bot Username')
			.setDescription("The bot's username on Twitch");
		twitch.addHiddenString('oAuth')
			.setName('Bot oAuth Token')
			.setDescription("Twitch oAuth token for the bot - do not share it with people! Get it at twitchapps.com/tmi/ using the bot's account");
		
		let se = this.addGroup('streamElements')
			.setName('Stream Elements')
			.setDescription('Settings for your StreamElements account');
		se.addString('accountID')
			.setName('Account ID')
			.setDescription("You StreamElements Account ID, as listed in the SE configuration page when you click on your name at the top-right");
		se.addHiddenString('token')
			.setName('JWT Token')
			.setDescription('Find this on your SE account details page after you click on "Show Secrets" there - keep it secret!');
		se.addString('pointsName', 'points')
			.setName('Points Name')
			.setDescription('The name of the loyalty points you defined on StreamElements (e.g. "pixels")');
		se.addString('pointsNameSingular', 'point')
			.setName('Points Name: Singular')
			.setDescription('The name of the loyalty points you defined on StreamElements in singular form (e.g. "pixel")');
		
		// let logs = this.addGroup('logs')
		// 	.setName('Logs')
		// 	.setDescription('Settings for information logging by the bot');
		// logs.addInteger('logLevelFile', 0)
		// 	.setName('File Log Level')
		// 	.setDescription('Minimum level required for a logged message to be written to the log file');
		// logs.addInteger('logLevelConsole', 0)
		// 	.setName('Console Log Level')
		// 	.setDescription('Minimum level required for a logged message to be written to the console');
		// logs.addNaturalNumber('maximumLogFieSize')
		// 	.setName('Max File Size')
		// 	.setDescription('Maximum size (in bytes) that a log file can grow to before another one is opened');
	}
	
	getValue(key) {
		return this.getChild(key).getValue();
	}
	
	getPort() {
		return this.getValue('port');
	}
	
	getStreamerName() {
		return this.getValue('streamerName');
	}
	
	getConfigBackupLimit() {
		return this.getValue('configBackupLimit');
	}
	
	getTwitchParams() {
		return this.getGroupValues('twitch');
	}
	
	getStreamElementsParams() {
		return this.getGroupValues('streamElements');
	}
	
	// getLoggerParams() {
	// 	return this.getGroupValues('logs');
	// }
}

module.exports = new MainConfig();
