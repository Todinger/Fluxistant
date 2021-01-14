'use strict';

const path = require('path');
const assert = require('assert').strict;
const Effect = require('../../effect');
const Utils = require('../../utils');

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;

// Adventures file structure:
//	{
//		active: true,	// true by default, set to false to disable the file
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
const PARTICIPANTS_PLACEHOLDER = /\$all/g;

// Represents the winner selected from among the participants
const WINNER_PLACEHOLDER = /\$winner/g;

// Represents every participant EXCEPT the chosen winner
const LOSERS_PLACEHOLDER = /\$losers/g;

// Represents the user in the relevant context (e.g. message sender)
const USER_PLACEHOLDER = /\$user/g;

// Represents the title of the type of the active adventure
const TITLE_PLACEHOLDER = /\$title/g;

// Represents the amount of points the winner of the adventure is rewarded
const REWARD_PLACEHOLDER = /\$reward/g;

// The command people use to join the adventure
const JOIN_COMMAND_PLACEHOLDER = /\$cmd/g;
const JOIN_COMMAND = 'join';

// Amount of points awarded to the winner
const VICTORY_REWARD = 500;

// How long we wait for users to join the adventure
const RECRUITMENT_DURATION = 1 * MINUTES;

// How often we remind people to join
const REMINDER_INTERVAL = 30 * SECONDS;

// The minimum amount of participants we are willing to start the adventure with
const MINIMUM_PARTICIPANTS = 2;

// How long we wait between showing parts of the adventure
const PARTS_PAUSE_LENGTH = 5 * SECONDS;

// Adventure Game
// --------------
// Lets users have a text adventure together.
// An adventure starts when a user enters the starting command: !adventure
// They're entered into a group of "adventurers" who are embarking upon this
// adventure, and a recruitment phase begins.
// During this phase, other users can use !join to join the adventure.
// There is a minimum number of participants, indicated by the
// MINIMUM_PARTICIPANTS constant. Failure to meet this amount results in the
// adventure being cancelled when the recruitment phase is over.
// 
// The recruitment phase lasts for RECRUITMENT_DURATION.
// Once it's over, assuming enough people entered, a random adventure is
// selected from the collection of adventures in the ADVENTURES_DIR subfolder
// (each file is a category of adventures which can be disabled by setting its
// "active" property to false in the JSON file).
// 
// Once the adventure begins, a winner is selected from the participants.
// The adventure is sent to the chat by the bot one part at a time, with a pause
// of PARTS_PAUSE_LENGTH between them.
// Once the final part is sent the winner is awarded VICTORY_REWARD
// StreamElements loyalty points.
// 
// Another adventure can start afterwards, but there can't be two of them active
// at the same time.
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
	
	// Loads a single JSON file with adventure data.
	// 
	// Parameters:
	// 	name	Adventure file/category identifier. Unique amongst files.
	// 	data	The contents of the JSON file.
	loadAdventureFile(name, data) {
		// Inactive files are ignored
		if (data.active == false) {
			return;
		}
		
		// Load all of the adventures in the file
		Object.keys(data.adventures).forEach(advname => {
			let advData = data.adventures[advname];
			
			// Array form means it's active
			if (Array.isArray(advData)) {
				data.adventures[advname] = {
					parts: advData,
					active: true,
				}
			// If it's not an array then it should be an object
			} else if (advData.active === false) {
				// Object form means it's inactive if it has an 'active'
				// property and it's set to false
				delete data.adventures[advname];
			}
			
			// If we haven't deleted it on account of it being inactive then
			// at this point it should have a .parts property which should
			// contain a non-empty array, so we make sure that's true
			if (data.adventures[advname]) {
				assert(
					data.adventures[advname].parts.length > 0,
					`Invalid adventure: ${advname} in ${name} is empty!`);
			}
		});
		
		// Save what we've loaded under the category name
		this.categories[name] = data;
	}
	
	// [Inherited, called externally]
	// Loads all the adventures from their files.
	// Replaces whatever we've loaded before.
	// If used while an adventure is active, it shouldn't affect it, but
	// starting another adventure might mess things up.
	// Just... don't do this while an adventure is ongoing; that'd be best. <_<
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
	
	// Replaces all the placeholders we know in the given text with their
	// intended values.
	// 
	// Parameters:
	// 	text	The text to fill.
	// 	[user]	User object to be used in relevant context (e.g. the user who
	// 			started the adventure).
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
				// The participants should be written in proper English, e.g.
				// 'Cee, Tee and JDee' for ['Cee', 'Tee', 'JDee'].
				result = result.replace(
					PARTICIPANTS_PLACEHOLDER,
					Utils.makeEnglishList(
						Object.values(this.activeAdventure.participants)
						.map(user => user.displayName)));
				
				// Same as the participants, only without the winner
				if (this.activeAdventure.winner) {
					result = result.replace(
						LOSERS_PLACEHOLDER,
						Utils.makeEnglishList(
							Object.values(this.activeAdventure.participants)
							.filter(user =>
								user.name !== this.activeAdventure.winner.name)
							.map(user => user.displayName)));
				}
			}
			
			// For the purpose of this working, a winner should be chosen as
			// soon as the adventure begins, even if they're awarded points only
			// at the end
			if (this.activeAdventure.winner) {
				result = result.replace(
					WINNER_PLACEHOLDER,
					this.activeAdventure.winner.displayName);
			}
		}
		
		return result;
	}
	
	// Shorthand for this.say(this.fillText(text, user)).
	fillSay(text, user) {
		this.say(this.fillText(text, user));
	}
	
	// Shorthand for this.say(target, this.fillText(text, user)).
	fillTell(target, text, user) {
		this.tell(target, this.fillText(text, user));
	}
	
	// Selects a random adventure from our cache and returns it.
	getRandomAdventure() {
		return Utils.randomElement(this.adventureCache);
	}
	
	// Begins the recruitment phase.
	// 
	// Parameters:
	// 	user	The user who started the adventure game.
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
	
	// Sends a timed reminder to the Twitch chat to tell people to join the
	// adventure and how.
	remind() {
		if (this.recruiting) {
			this.fillSay('Use $cmd to take part in the $title!');
		}
	}
	
	// Signs the given user up for the adventure.
	// Does nothing if the user is already taking part in it.
	// 
	// Parameters:
	// 	user	The user signing up.
	join(user) {
		if (!(user.name in this.activeAdventure.participants)) {
			this.activeAdventure.participants[user.name] = user;
			this.fillSay('$user joins the $title!', user);
		}
	}
	
	// Ends the recruitment phase.
	// This should be called when the phase ends (i.e. when the adventure
	// starts) or when the adventure is cancelled.
	stopRecruiting() {
		this.recruiting = false;
		if (this.reminderIntervalHandle) {
			clearInterval(this.reminderIntervalHandle);
			this.reminderIntervalHandle = null;
		}
	}
	
	// Begins a new adventure.
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
	
	// Selects a winner from the group of adventurers.
	// Stores the result in the active adventure.
	// Should only be called while an adventure is underway.
	chooseWinner() {
		this.activeAdventure.winner = 
			Utils.randomValue(this.activeAdventure.participants);
	}
	
	// Sends the next part of the adventure to the chat.
	nextPart() {
		this.nextPartTimerHandle = null;
		
		let adv = this.activeAdventure;
		this.fillSay(adv.parts[adv.currentPart++]);
		
		if (adv.currentPart < adv.parts.length) {
			// If we haven't reached the end of the adventure then schedule the
			// next part
			this.nextPartTimerHandle = setTimeout(
				() => this.nextPart(),
				PARTS_PAUSE_LENGTH);
		} else {
			// Otherwise we give the winner their points and end the adventure
			this.modifyUserPoints(this.activeAdventure.winner, VICTORY_REWARD);
			this.endAdventure();
		}
	}
	
	// Ends the adventure, whether it's done or still taking place, no matter
	// which phase it's in.
	endAdventure() {
		// Stop recruitment phase
		this.stopRecruiting();
		
		// Clear timers that are meant to do stuff to continue the adventure
		if (this.startAdventureTimerHandle) {
			clearTimeout(this.startAdventureTimerHandle);
			this.startAdventureTimerHandle = null;
		}
		
		if (this.nextPartTimerHandle) {
			clearTimeout(this.nextPartTimerHandle);
			this.nextPartTimerHandle = null;
		}
		
		// Mark that there is no active adventure
		this.activeAdventure = null;
	}
	
	// [Inherited, called externally]
	// Effect entry point.
	load() {
		this.registerCommand({
			cmdname: 'adventure',
			aliases: ['adv'],
			callback: user => this.startRecruiting(user),
		});
		
		this.registerCommand({
			cmdname: JOIN_COMMAND,
			filters: [() => this.recruiting],
			callback: user => this.join(user),
		});
		
		this.registerCommand({
			cmdname: 'endadventure',
			filters: [Effect.Filters.isOneOf(['yecatsmailbox', 'fluxistence'])],
			callback: user => this.endAdventure(),
		});
	}
}

module.exports = new Adventure();
