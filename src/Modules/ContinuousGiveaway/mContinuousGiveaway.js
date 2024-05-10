const Module = requireMain('module');
const ConfigSourceManager = requireMain('configSourceManager');
const Utils = requireMain('utils');
const _ = require('lodash');


const FONT_TYPES_SOURCE_NAME = 'ContinuousGiveaway.FontTypes';

const WIN_MESSAGE_TEMPLATE = {
	winner: "$winner",
};

const WIN_MESSAGE_TEMPLATE_VARIABLE_HINTS = `${WIN_MESSAGE_TEMPLATE.winner} = winner's username`;


class ContinuousGiveaway extends Module {
	constructor() {
		super({
			name: 'Continuous Giveaway',
			tags: ['textdisp'],
		});
		
		this.ongoing = false;
		this.data.entrees = {};
	}

	defineModConfig(modConfig) {
		modConfig.addString('alreadyJoinedMessage', 'You have already joined the giveaway.')
			.setName('Already Joined Message')
			.setDescription("Message to send to a user who joins the giveaway if they've already joined");
		modConfig.addString('alreadyWonMessage', "You've already won this giveaway once and cannot enter again.")
			.setName('Already Won Message')
			.setDescription("Message to send to a user who joins the giveaway if they've already won it once");
		modConfig.addString('winMessageChat', `${WIN_MESSAGE_TEMPLATE.winner} has won the giveaway!`)
			.setName('Win Message: Chat')
			.setDescription(`Message to send to the winner when they win (${WIN_MESSAGE_TEMPLATE_VARIABLE_HINTS})`);
		modConfig.addBoolean('showWinnerOnScreen', false)
			.setName('Show Winner on Screen')
			.setDescription("Whether or not the winner's name should be displayed on the screen");
		modConfig.addString('winMessageScreen', `${WIN_MESSAGE_TEMPLATE.winner} has won the giveaway!`)
			.setName('Win Message: Screen')
			.setDescription(`Message to show on the screen when someone wins (${WIN_MESSAGE_TEMPLATE_VARIABLE_HINTS})`);
		modConfig.addCustomChoice('winnerDisplayStyle', {
				source: FONT_TYPES_SOURCE_NAME,
			})
			.setName('Winner Display Text Style')
			.setDescription("The style in which the winner's name will be displayed on the screen");
		modConfig.addColor('winnerDisplayColor', '#000000')
			.setName('Winner Display Text Color')
			.setDescription('Text color when displaying the winner on the screen');
		modConfig.addDuration('winnerDisplayDuration', 10)
			.setName('Winner Display Text Duration')
			.setDescription('How long (in seconds) to show the winning message on the screen');
	}

	load() {
		ConfigSourceManager.setSourceOptions(
			FONT_TYPES_SOURCE_NAME,
			['Regular', 'Creepy'],
		);
	}
	
	start(data) {
		if (this.ongoing) {
			this.tellError(data.user, "A giveaway is already underway!");
			return;
		}
		
		this.data.entrees = {};
		this.ongoing = true;
		this.saveData();
		
		this.say("A giveaway is underway!");
	}
	
	resume(data) {
		if (this.ongoing) {
			this.tellError(data.user, "A giveaway is already underway!");
			return;
		}
		
		this.ongoing = true;
	}
	
	end() {
		if (!this.ongoing) {
			return;
		}
		
		this.say("The giveaway has ended.");
		this.ongoing = false;
	}
	
	join(data) {
		if (!this.ongoing) {
			return false;
		}
		
		if (data.user.displayName in this.data.entrees) {
			if (this.data.entrees[data.user.displayName]) {
				if (this.config.alreadyWonMessage && this.config.alreadyWonMessage.length > 0) {
					this.tell(data.user, this.config.alreadyWonMessage);
				}
			} else {
				if (this.config.alreadyJoinedMessage && this.config.alreadyJoinedMessage.length > 0) {
					this.tell(data.user, this.config.alreadyJoinedMessage);
				}
			}
			return false;
		}
		
		this.data.entrees[data.user.displayName] = false; // false = hasn't won yet
		this.saveData();
		this.log(`${data.user.displayName} entered.`);
	}

	getActiveEntrees() {
		return Object.keys(this.data.entrees).filter(entree => !this.data.entrees[entree]);
	}
	
	draw(data) {
		if (!this.ongoing && _.isEmpty(this.data.entrees)) {
			return;
		}
		
		let options = this.getActiveEntrees();
		if (options.length === 0) {
			this.tellError(data.user, "There are no entrees viable for winning at this time.")
			return;
		}
		
		let winner = Utils.randomElement(options);
		this.data.entrees[winner] = true;
		this.saveData();
		let templateValues = {
			winner,
		};
		this.sayTemplate(this.config.winMessageChat, WIN_MESSAGE_TEMPLATE, templateValues);
		if (this.config.showWinnerOnScreen) {
			this.broadcastEvent('showText', {
				text: this.fillTemplate(this.config.winMessageScreen, WIN_MESSAGE_TEMPLATE, templateValues),
				style: this.config.winnerDisplayStyle,
				color: this.config.winnerDisplayColor,
				duration: this.config.winnerDisplayDuration,
			});
		}
	}

	list() {
		let names = this.getActiveEntrees();
		if (names.length > 0) {
			this.print('Current giveaway entries:');
			names.forEach(username => this.print(`- ${username}`));
		} else {
			this.print('There are currently no entries in the giveaway.')
		}
	}
	
	functions = {
		start: {
			name: 'Start Giveaway',
			description: 'Starts a continuous giveaway',
			triggers: [
				this.trigger.command({
					cmdname: 'startcga',
				}),
			],
			filters: [
				this.filter.specificUser("fluxistence"),
			],
			action: data => this.start(data),
		},
		resume: {
			name: 'Resume Giveaway',
			description: 'Starts an ongoing continuous giveaway without clearing previous results',
			triggers: [
				this.trigger.command({
					cmdname: 'resumecga',
				}),
			],
			filters: [
				this.filter.specificUser("fluxistence"),
			],
			action: data => this.resume(data),
		},
		end: {
			name: 'End Giveaway',
			description: 'Ends an ongoing continuous giveaway',
			triggers: [
				this.trigger.command({
					cmdname: 'endcga',
				}),
			],
			filters: [
				this.filter.specificUser("fluxistence"),
			],
			action: () => this.end(),
		},
		join: {
			name: 'Join Giveaway',
			description: 'Enters the user into an ongoing continuous giveaway',
			triggers: [
				this.trigger.command({
					cmdname: 'enter',
				}),
				this.trigger.command({
					cmdname: 'ticket',
				}),
			],
			action: data => this.join(data),
		},
		draw: {
			name: 'Draw Winner',
			description: "Draw a single winner who hasn't won yet from current entrees",
			triggers: [
				this.trigger.command({
					cmdname: 'draw',
				}),
			],
			filters: [
				this.filter.specificUser("fluxistence"),
			],
			action: data => this.draw(data),
		},
		list: {
			name: 'List Entries',
			description: "List all the people who have entered the giveaway in the console",
			triggers: [
				this.trigger.cli({
					cmdname: 'entries',
				}),
			],
			action: () => this.list(),
		},
	}
}

module.exports = new ContinuousGiveaway();
