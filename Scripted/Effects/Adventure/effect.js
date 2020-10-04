'use strict';

const path = require('path');
const assert = require('assert').strict;
const Effect = require('../../effect');
const Utils = require('../../utils');

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;

// Adventures file structure:
//	{
//		title: "AdventureCategoryName",	// E.g. "adventure" / "",
//		startDesc: "$user has started an adventure! Enter $cmd to join!",
//		adventures: {
//			advname: ADVENTURE_DETAILS,
//		},
//	}
// 
// advname: ADVENTURE_DETAILS,
// Where ADVENTURE_DETAILS is one of these options:
// 
// advname: ["Each", "entry", "is", "one", "message", "by", "the", "bot"],
// 
// advname: {
//		parts: ["Same", "as", "above"],
//		active: false,
// }
const ADVENTURES_DIR = 'Adventures';

// Represents everyone who is participating in the adventure
const PARTICIPANTS_PLACEHOLDER = '$all';

// Represents the winner selected from among the participants
const WINNER_PLACEHOLDER = '$winner';

// Represents the user in the relevant context (e.g. message sender)
const USER_PLACEHOLDER = '$user';

// Represents the title of the type of the active adventure
const TITLE_PLACEHOLDER = '$title';

// Represents the amount of points the winner of the adventure is rewarded
const REWARD_PLACEHOLDER = '$reward';

// The command people use to join the adventure
const JOIN_COMMAND_PLACEHOLDER = '$cmd';
const JOIN_COMMAND = 'j';

// Amount of points awarded to the winner
const VICTORY_REWARD = 500;

// How long we wait for users to join the adventure
const RECRUITMENT_DURATION = 5 * SECONDS;
// const RECRUITMENT_DURATION = 2 * MINUTES;

// How often we remind people to join
const REMINDER_INTERVAL = 1 * SECONDS;
// const REMINDER_INTERVAL = 30 * SECONDS;

// The minimum amount of participants we are willing to start the adventure with
const MINIMUM_PARTICIPANTS = 1;

// How long we wait between showing parts of the adventure
const PARTS_PAUSE_LENGTH = 1 * SECONDS;
// const PARTS_PAUSE_LENGTH = 5 * SECONDS;

class Adventure extends Effect {
	constructor() {
		super({
			name: 'Adventure',
		});
		
		// Adventure data is stored here
		this.categories = null;
		
		// Allows for a fair random selection of an adventure
		this.adventureCache = null;
		
		// Not null when there's an ongoing adventure
		this.activeAdventure = null;
		
		// Specifies if we're waiting for participants
		this.recruiting = false;
		
		// Used to stop the reminders to join the adventure
		this.reminderIntervalHandle = null;
		
		// Used to stop the the adventure, if it's cancelled
		this.startAdventureTimerHandle = null;
		this.nextPartTimerHandle = null;
	}
	
	loadAdventureFile(name, data) {
		if (data.active == false) {
			return;
		}
		
		Object.keys(data.adventures).forEach(advname => {
			let advData = data.adventures[advname];
			
			// Array form means it's active
			if (Array.isArray(advData)) {
				data.adventures[advname] = {
					parts: advData,
					active: true,
				}
			} else if (advData.active === false) {
				// Object form means it's inactive if it has an 'active'
				// property and it's set to false
				delete data.adventures[advname];
			}
			
			if (data.adventures[advname]) {
				assert(
					data.adventures[advname].parts.length > 0,
					`Invalid adventure: ${advname} in ${name} is empty!`);
			}
		});
		
		this.categories[name] = data;
	}
	
	loadData() {
		this.categories = {};
		this.adventureCache = [];
		
		// Load each file
		let advFiles = Utils.getFiles(path.join(this.workdir, ADVENTURES_DIR));
		advFiles.forEach(filename => {
			let parsed = path.parse(filename);
			let adventureFile = this.readJSON(path.join(ADVENTURES_DIR, filename));
			this.loadAdventureFile(parsed.name, adventureFile);
		});
		
		// Create a cache of adventures out of all of the active
		// files and adventures
		// This is so we can choose a random one later and have equal odds
		// for each adventure to be chosen, rather than choosing a category
		// at random which makes adventures in categories that have many have
		// lower odds of being selected than ones in categories that have few
		Object.keys(this.categories).forEach(category => {
			Object.keys(this.categories[category].adventures).forEach(adv => {
				this.adventureCache.push({
					category: category,
					name: adv,
				});
			});
		});
		
		this.log('Adventures loaded, yay!');
	}
	
	fillText(text, user) {
		let result = text;
		
		result = result.replace(JOIN_COMMAND_PLACEHOLDER, `!${JOIN_COMMAND}`);
		result = result.replace(REWARD_PLACEHOLDER, VICTORY_REWARD);
		
		if (user) {
			result = result.replace(USER_PLACEHOLDER, user.displayName);
		}
		
		if (this.activeAdventure) {
			result = result.replace(
				TITLE_PLACEHOLDER,
				this.activeAdventure.title);
			
			if (this.activeAdventure.participants) {
				result = result.replace(
					PARTICIPANTS_PLACEHOLDER,
					Utils.makeEnglishList(
						Object.values(this.activeAdventure.participants)
						.map(user => user.displayName)));
			}
			
			if (this.activeAdventure.winner) {
				result = result.replace(
					WINNER_PLACEHOLDER,
					this.activeAdventure.winner.displayName);
			}
		}
		
		return result;
	}
	
	fillSay(text, user) {
		this.say(this.fillText(text, user));
	}
	
	fillTell(target, text, user) {
		this.tell(target, this.fillText(text, user));
	}
	
	getRandomAdventure() {
		return Utils.randomElement(this.adventureCache);
	}
	
	// TODO: Remove for production
	// These makes us print to console instead of saying in chat
	say(msg) {
		this.log(msg);
	}
	tell(user, msg) {
		this.say(`@${user.displayName} ${msg}`);
	}
	
	startRecruiting(user) {
		if (this.activeAdventure) {
			this.fillTell(user, 'There is already an active $title!');
			return;
		}
		
		let adv = this.getRandomAdventure();
		this.activeAdventure = {
			category: adv.category,
			name: adv.name,
			
			title: this.categories[adv.category].title,
			startDesc: this.categories[adv.category].startDesc,
			parts: this.categories[adv.category].adventures[adv.name].parts,
			participants: { [user.name]: user },
			
			currentPart: 0,
		};
		
		this.recruiting = true;
		
		this.fillSay(this.activeAdventure.startDesc, user);
		this.fillSay('Use $cmd to join!');
		
		this.reminderIntervalHandle = setInterval(
			() => this.remind(), REMINDER_INTERVAL);
		
		this.startAdventureTimerHandle = setTimeout(
			() => this.startAdventure(),
			RECRUITMENT_DURATION);
	}
	
	remind() {
		if (this.recruiting) {
			this.fillSay('Use $cmd to take part in the $title!');
		}
	}
	
	join(user) {
		if (!(user.name in this.activeAdventure.participants)) {
			this.activeAdventure.participants[user.name] = user;
			this.fillSay('$user joins the $title!', user);
		}
	}
	
	stopRecruiting() {
		this.recruiting = false;
		if (this.reminderIntervalHandle) {
			clearInterval(this.reminderIntervalHandle);
			this.reminderIntervalHandle = null;
		}
	}
	
	startAdventure() {
		// This is in case we've cancelled the adventure before it started
		if (!this.activeAdventure) {
			return;
		}
		
		this.stopRecruiting();
		
		if (Object.keys(this.activeAdventure.participants).length < MINIMUM_PARTICIPANTS) {
			this.fillSay(`Oh no, we don't have enough people! We need at least ${MINIMUM_PARTICIPANTS} to start the $title.`);
			this.endAdventure();
			return;
		}
		
		this.chooseWinner();
		this.nextPart();
	}
	
	chooseWinner() {
		this.activeAdventure.winner = 
			Utils.randomValue(this.activeAdventure.participants);
	}
	
	nextPart() {
		this.nextPartTimerHandle = null;
		
		let adv = this.activeAdventure;
		this.fillSay(adv.parts[adv.currentPart++]);
		
		if (adv.currentPart < adv.parts.length) {
			this.nextPartTimerHandle = setTimeout(
				() => this.nextPart(),
				PARTS_PAUSE_LENGTH);
		} else {
			this.modifyUserPoints(this.activeAdventure.winner, VICTORY_REWARD);
			this.endAdventure();
		}
	}
	
	endAdventure() {
		this.stopRecruiting();
		
		if (this.startAdventureTimerHandle) {
			clearTimeout(this.startAdventureTimerHandle);
			this.startAdventureTimerHandle = null;
		}
		
		if (this.nextPartTimerHandle) {
			clearTimeout(this.nextPartTimerHandle);
			this.nextPartTimerHandle = null;
		}
		
		this.activeAdventure = null;
	}
	
	load() {
		this.registerCommand({
			cmdname: 'a',
			// cmdname: 'adventure',
			// aliases: ['adv'],
			filters: [Effect.Filters.isOneOf(['yecatsmailbox', 'fluxistence'])],
			callback: user => this.startRecruiting(user),
		});
		
		this.registerCommand({
			cmdname: JOIN_COMMAND,
			filters: [() => this.recruiting],
			callback: user => this.join(user),
		});
		
		this.registerCommand({
			cmdname: 'e',
			// cmdname: 'endadventure',
			filters: [Effect.Filters.isOneOf(['yecatsmailbox', 'fluxistence'])],
			callback: user => this.endAdventure(),
		});
	}
}

module.exports = new Adventure();
