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
			.setDescription('How many previous good configurations should be saved as backup')
			.setHelp('Configuration files and backups are stored under %APPDATA%\\Fluxbot.');
		
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
			.setDescription("Twitch oAuth token for the bot - do not share it with people!")
			.setHelp(`This gives the bot authority over the bot account you've set up.
It's sensitive information, so do not share it with others!
You can get it by logging into Twitch with your bot's account and then visiting https://twitchapps.com/tmi/.
Protip: If you don't want to log out of Twitch on your browser, use its incognito mode. You should be logged out there.`);
		
		let se = this.addGroup('streamElements')
			.setName('Stream Elements')
			.setDescription('Settings for your StreamElements account');
		se.addHiddenString('accountID')
			.setName('Account ID')
			.setDescription("You StreamElements Account ID, as listed in the SE configuration page when you click on your name at the top-right")
			.setHelp(`To find this, go to https://streamelements.com/dashboard/account/channels (log in through Twitch if necessary). Then you'll find it under "Account ID".`);
		se.addHiddenString('token')
			.setName('JWT Token')
			.setDescription('Secret token used to connect as "you" to your StreamElements account')
			.setHelp(`This is sensitive information, so don't give it out to people!
You can find it on your [StreamElements account details page](https://streamelements.com/dashboard/account/channels) after you click on "Show Secrets" there.`);
		se.addString('pointsName', 'points')
			.setName('Points Name')
			.setDescription('The name of the loyalty points you defined on StreamElements (e.g. "pixels")');
		se.addString('pointsNameSingular', 'point')
			.setName('Points Name: Singular')
			.setDescription('The name of the loyalty points you defined on StreamElements in singular form (e.g. "pixel")');
		
		this.addDynamicArray('channelRewards', 'ChannelReward')
			.setName('Channel Rewards')
			.setDescription("A list of all the channel point rewards that the bot can recognize on your channel");
		
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
		return this.getChild('twitch').getChild('channel').getValue();
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
	
	getChannelRewards() {
		let rewardsList = this.getChild('channelRewards').toConf();
		let rewards = {};
		rewardsList.forEach(reward => {
			rewards[reward.rewardID] = reward.rewardName;
		});
		
		return rewards;
	}
}

module.exports = new MainConfig();
