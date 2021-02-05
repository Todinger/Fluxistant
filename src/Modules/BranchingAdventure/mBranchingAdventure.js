'use strict';

const path = require('path');
const assert = require('assert').strict;
const _ = require('lodash');
const Module = require('../../module');
const Utils = require('../../utils');

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;

// Adventures file structure:
//	{
//		active: true,	// true by default, set to false to disable the file
//		title: "AdventureCategoryName",	// E.g. "adventure" / "",
//		adventures: {
//			advname: ADVENTURE_DETAILS,
//		},
//	}
// 
// advname: ADVENTURE_DETAILS,
// Where ADVENTURE_DETAILS is structured like so:
// advname: {
//		start: "chapterName",
//		chapters: {
//			chapterName: [
//				"Each entry",
//				"is one message by the bot.",
//				"To define branches, use brackets to give the user their",
//				"options, like so:",
//				"Choose if you want to go [left:leftArea] or [right:rightArea]."
//			],
//			leftArea: [
//				"After the bot finishes telling a chapter, it waits for the",
//				"user's text, which can be a regular message.",
//				"When it sees the user enter a name used anywhere in the",
//				"chapter on the left side of brackets, like 'left' and 'right'",
//				"from chapterName, it proceeds to the chapter name that was",
//				"listed on the right side of those brackets.",
//				"So if the user enters 'left' after the above chapterName",
//				"is done showing, this chapter here would then be printed,"
//				"and if they enter 'right'..."
//			],
//			rightArea: [
//				"...then this chapter would be chosen instead.",
//				"Note that the choice doesn't need to be a single word.",
//				"For example, you can ask the user if they want to",
//				"[go upstairs:upstairs] or [head into the kitchen:kitchen].",
//				"It is recommended to make the choices simple, though, without",
//				"too much text."
//			],
//			
//			someOtherChapter: [
//				"There is one more feature here, for adding some randomness.",
//				"When presenting a choice, you can enter multiple options for",
//				"where the story can go if that choice is entered, with",
//				"optional weights to represent the odds.",
//				"Example: $player, there's a saw blade coming towards you!",
//				"Do you [jump:jumpSafe,jumpDeath] or",
//				"[duck:duckSafe|1,duckDeath|3]?",
//				"If the player enters 'jump', there's a 50/50 chance of",
//				"reaching jumpSafe or jumpDeath.",
//				"If they enter 'duck', there's a 1 in 4 chance of reaching",
//				"duckSafe and a 3 in 4 chance of reaching duckDeath.",
//			],
//			jumpSafe: [...],
//			jumpDeath: [...],
//			duckSafe: [...],
//			duckDeath: [...],
//			
//			aChapterWithPoints: {
//				points: 30,
//				parts: [
//					"You can also define a chapter as an object rather than",
//					"a list of messages. This allows you to add a 'points'",
//					"value, which will be given to the player upon reaching",
//					"chapter. Using a negative number will result in points",
//					"being deducted from the player.",
//					"If the chapter is a winning or losing one, the value of",
//					"points specified for it will override the default prize",
//					"or penalty for winning and losing chapters.",
//					"Everything else works the same; you just write the list",
//					"of messages in the 'parts' array."
//				]
//			},
//			
//			...
//		},
//		winningChapters: [	// Reaching these chapters grants victory
//			"jumpSafe",
//			"duckSafe",
//		],
//		losingChapters: [ // Reaching these chapters causes loss
//			"jumpDeath",
//			"duckDeath",
//		],
//		active: false, // true by default, set to false to disable the adventure
// }
// 
// IMPORTANT NOTE:
// A choice should only appear ONCE in a chapter (across all of its lines).
// That is, writing [jump: (...)] and then later again [jump: (...)] will result
// in an error, even if the details are the same.
// If you want to refer to the choice again, simply write the choice name, e.g.:
// 	[
// 		"Do you [jump: jumpSafe, jumpDeath] or [duck: duckSafe, duckDeath]?",
// 		"You have a feeling that if you jump you'll have a better chance of survival."
// 	]
// 
// Another note:
// You can add spaces all you like within choice brackets.
// Writing this:
// 	"[go upstairs:upstairs]"
// is the same as writing any of these:
// 	"[go upstairs: upstairs]"
// 	"[ go upstairs : upstairs ]"
// 	"[       go upstairs :     upstairs ]"
// Similarly when specifying multiple outcome choices:
// 	"[duck:duckSafe|1,duckDeath|3]"
// is the same as:
// 	"[duck: duckSafe|1 , duckDeath|3]"
// 	"[duck: duckSafe | 1, duckDeath | 3]" // <-- Personally I'd go with this
// Furthermore, the default weight of options is 1, so the above is also the
// same as:
// 	"[duck: duckSafe, duckDeath | 3]"
const ADVENTURES_DIR = 'Adventures';

// Represents the "player" in the game - i.e. the user who is currently
// participating in the adventure (note: there may be multiple branching
// adventures occurring at the same time, in which case this represents the user
// in their own adventure only)
const USER_PLACEHOLDER = /\$player/g;

// Represents the title of the type of the active adventure
const TITLE_PLACEHOLDER = /\$title/g;

// Represents the amount of points won if the venture is successful
const REWARD_PLACEHOLDER = /\$reward/g;

// Represents the amount of points lost if the venture is unsuccessful
const PENALTY_PLACEHOLDER = /\$penalty/g;

// Amount of points awarded upon victory
const VICTORY_REWARD = 500;

// Amount of points awarded upon loss
const LOSS_PENALTY = VICTORY_REWARD;

// If no start chapter name is specified, this is the one that will be used
const DEFAULT_START_CHAPTER = 'start';

// How long we wait between showing parts of the adventure
// const PARTS_PAUSE_LENGTH = 1 * SECONDS;
const PARTS_PAUSE_LENGTH = 5 * SECONDS;

// How long we're willing to wait for user input before we cancel the adventure
// const PATIENCE = 2 * MINUTES;
const PATIENCE = 5 * MINUTES;

// How often we nag the user to make a choice while waiting for input
// const REMINDER_INTERVAL = 15 * SECONDS;
const REMINDER_INTERVAL = 1 * MINUTES;

// The bot will say one of these randomly when reminding the player to make a
// choice
const REMINDER_MESSAGES = [
	"$player, are you there? I'm waiting.",
	"/me looks at $player impatiently.",
	"@$player Well, tell me when you're ready. I'll just be here, rewriting some stuff. <_<",
	"Earth calling $player, Earth calling $player... Houston, I think we have a problem.",
];

// The bot will say one of these randomly when cancelling the adventure
const TIMEOUT_MESSAGES = [
	"@$player Alright, that's it. I got better things to do. Adventure over.",
	"@$player Oh no! Some bot here sneezed and your character blinked out of existence (*whisper* I think it's StreamElements)! Guess the adventure is over now.",
	"Apparently $player is giving me the silent treatment, so... See you on the next adventure!",
	"@$player I don't have to take this. I'm going home. *Adventure goes poof*",
	"@$player No adventure for you! Come back, one year!",
	"Trying to contact $player... No response. Abort adventure! Abort adventure!",
	"@$player The adventure you seek has now moved to another castle.",
	"$player failed to complete the adventure (404 error, adventurer not found).",
];

// This regular expression matches the chapter choices syntax.
// For example, for this string:
// 	let test = '[duck: duckSafe | 1, duckDeath | 3]';
// The result of test.match(CHOICE_REGEX) will have the following matches:
// [0] '[duck quickly: duckSafe | 1, duckDeath | 3]'	// The entire expression
// [1] 'duck quickly'									// Choice string for player
// [2] 'duckSafe'										// Option #1
// [3] '1'												// Option #1 weight
// [4] 'duckDeath'										// Option #2
// [5] '3'												// Option #2 weight
// 
// And for this string:
// 	let test = '[duck: duckSafe, duckDeath | 3]';
// The will be:
// [0] '[duck: duckSafe | 1, duckDeath | 3]'	// The entire expression
// [1] 'duck'									// Choice string for player
// [2] 'duckSafe'								// Option #1
// [3] undefined								// Option #1 weight
// [4] 'duckDeath'								// Option #2
// [5] '3'										// Option #2 weight
// 
// In other words, when analyzing the result of the match() operation, we get:
// [0] The entire match, not interesting.
// [1] The text the player needs to enter to opt for this choice.
// [2+] Each pair of matches from this point on represents a chapter name to
//      go to and the weight of that option happening. If no weight was
//      specified, the second element will be undefined, which we can then
//      default to 1.
// 
// The list of choices is optional. If not given, the text should be in the form
// of "[text]", which means that when the user enters "text", the adventure will
// proceed to the chapter titled "text".
// 
// Since we can (and obviously will) have multiple matches in our search, we
// need to make the regex stateful with the trailing /g, and then to search for
// all occurrences we use something like:
// 	while (matches = CHOICE_REGEX.exec(chapterPartText)) {
// 		// Process the matches array expecting the above structure
// 	}
// const CHOICE_REGEX = /\[([^:\|]+?)\s*(?:(?:\:\s*([a-zA-Z0-9_\$]+)\s*(?:\|\s*(\d+))?)(?:\s*,\s*([a-zA-Z0-9_\$]+)\s*(?:\|\s*(\d+))?)*\s*)?\]/g;
const CHOICE_REGEX = /\[([^:|]+?)\s*(?::([^\]]+))?]/g;
const CHAPTER_OPTIONS = /(?:\s*([a-zA-Z0-9_$]+)\s*(?:\|\s*(\d+))?\s*)/g;

// This is for "next" values for a chapter.
// It's the same as the part in CHOICE_REGEX that describes the options of which
// chapters can be chosen and their weights (since it has the same meaning here,
// only without the player's choice).
const CHAPTER_OPTIONS_REGEX = /(?:\s*([a-zA-Z0-9_$]+)\s*(?:\|\s*(\d+))?)(?:\s*,\s*([a-zA-Z0-9_$]+)\s*(?:\|\s*(\d+))?)*\s*/g;

// Branching Adventure Game
// ------------------------
// Lets users have a personal text adventure with branching choices.
// Each time the user is shown a "chapter", possibly with a choice to make.
// The user enters their choice, which causes the story to advance to another
// chapter as defined in the adventure data (see the HUGE comment above the
// ADVENTURES_DIR constant).
// 
// An adventure starts when a user enters the starting command.
// There is a limited amount of time for the user to enter their choices after
// every chapter, after which the adventure is forcibly ended by the bot (it
// will send reminders to the player at fixed intervals).
// Once a winning or losing chapter is reached, it is displayed and then the
// adventure ends and points are granted or deducted based on the result.
// 
// A user can only have one branching adventure running at a time, but there can
// be branching adventures running for multiple users concurrently.
// Once a user finishes an adventure they can start a new one.
// 
// A user may cancel their own adventure if they wish.
// No idea if we should deduct points when that happens. Probably?
class BranchingAdventure extends Module {
	constructor() {
		super({
			name: 'Branching Adventure',
			// enabled: false,
			// debug: true,
		});
		
		// Adventure data is stored here
		this.categories = null;
		
		// Allows for a fair random selection of an adventure
		this.adventureCache = null;
		
		// Not null for a user when there's an ongoing adventure for them
		this.activeAdventures = {};
		
		// Used to stop the reminders to enter selection
		this.reminderIntervalHandle = null;
		
		// Used to stop the the adventure, if it's cancelled
		this.nextPartTimerHandle = null;
	}
	
	endAllAdventures() {
		
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
			this.log(`Loading adventure file: ${filename}`);
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
		
		this.log('Branching adventures loaded, yay!');
	}
	
	// Loads a single JSON file with adventure data.
	// 
	// Parameters:
	// 	name	Adventure file/category identifier. Unique amongst files.
	// 	data	The contents of the JSON file.
	loadAdventureFile(name, data) {
		// Inactive files are ignored
		if (data.active === false) {
			return;
		}
		
		let loadedAdventures = {};
		
		// Load all of the adventures in the file
		Object.keys(data.adventures).forEach(advname => {
			let loadedAdventure = {};
			let advData = data.adventures[advname];
			
			if (advData.active === false) {
				// Inactive means we want to treat it as if it wasn't there to
				// begin with
				delete data.adventures[advname];
			} else {
				// If we're here then either advData.active === true or it
				// wasn't provided, which also means it's active
				
				// Default starting chapter, if one isn't provided
				if (!advData.start) {
					advData.start = DEFAULT_START_CHAPTER;
				}
				
				// Data validation
				this.validateAdventure(name, advname, advData);
				
				// Data copy and populations
				loadedAdventure.start = advData.start;
				if (advData.winningChapters) {
					loadedAdventure.winningChapters = advData.winningChapters;
				}
				if (advData.losingChapters) {
					loadedAdventure.losingChapters = advData.losingChapters;
				}
				
				// Load the chapters themselves (this requires some work)
				loadedAdventure.chapters = this.loadChapters(advData);
				
				loadedAdventures[advname] = loadedAdventure;
			}
		});
		
		// Save what we've loaded under the category name
		this.categories[name] = {
			title: data.title,
			adventures: loadedAdventures,
		};
	}
	
	validateAdventure(name, advname, advData) {
		assert(
			advData.start,
			`Invalid adventure: "${advname}" in "${name}" has no starting chapter!`);
		assert(
			advData.chapters && !_.isEmpty(advData.chapters),
			`Invalid adventure: "${advname}" in "${name}" is empty!`);
		assert(
			(advData.winningChapters && !_.isEmpty(advData.winningChapters)) ||
			(advData.losingChapters && !_.isEmpty(advData.losingChapters)),
			`Invalid adventure: "${advname}" in ${name} has no winning or losing chapters!`);
		
		assert(
			advData.start in advData.chapters,
			`Invalid adventure: Starting chapter name of "${advname}" in "${name}" is missing from its chapters!`);
		
		if (advData.winningChapters) {
			assert(
				Utils.isArraySubset(
					advData.winningChapters,
					Object.keys(advData.chapters)),
				`Invalid adventure: "${advname}" in "${name}" has a winning chapter name that isn't in its chapters!`);
		}
		
		if (advData.losingChapters) {
			assert(
				Utils.isArraySubset(
					advData.losingChapters,
					Object.keys(advData.chapters)),
				`Invalid adventure: "${advname}" in "${name}" has a losing chapter name that isn't in its chapters!`);
		}
		
		if (advData.winningChapters && advData.losingChapters) {
			let intersection = _.intersection(
				advData.winningChapters,
				advData.losingChapters);
			
			assert(
				intersection.length === 0,
				`Invalid adventure: Chapter "${intersection[0]}" of "${advname}" in "${name}" is set to be both winning and losing!`);
		}
	}
	
	loadChapters(advData) {
		let chapters = advData.chapters;
		let result = {};
		Object.keys(chapters).forEach(chapterName => {
			result[chapterName] = this.loadChapter(
				chapterName,
				advData);
		});
		
		return result;
	}
	
	// We ignore surrounding spaces, multiple spaces and letter casing in choice
	// strings
	toChoiceString(str) {
		return str.trim().replace(/\s\s+/g, ' ').toLowerCase();
	}
	
	// Parses the part of a choice string defined by the CHAPTER_OPTIONS.
	// This appears in both player choices and automatic "next" options.
	// 
	// Parameters:
	// 	optionsString	A string that should conform to CHAPTER_OPTIONS.
	// 	chapterName		The chapter for which this is done. For error printing
	// 					purposes.
	// 	advData			Data of the adventure being loaded. Used for validation
	// 					purposes.
	parseChapterOptions(optionsString, chapterName, advData) {
		let options = {};
		
		// Options are delimited by commas, so first we split the string into
		// the different separate options
		let optionStrings = optionsString.split(',');
		
		// Now we parse each one and aggregate the results
		optionStrings.forEach(os => {
			CHAPTER_OPTIONS.lastIndex = 0;
			let matches = CHAPTER_OPTIONS.exec(os);
			
			// If we got no matches then the given chapter options string is
			// badly formed
			assert(matches, `Bad choice string in "${chapterName}": ${os}`);
			
			// The first match (after the global match) is the name of the
			// chapter we go to, and the second one is its weight, which is
			// optional and defaults to '1'
			let optionChapterName = matches[1];
			let weight = matches[2] || '1';
			
			// Make sure the desired chapter *is* indeed a chapter
			assert(
				optionChapterName in advData.chapters,
				`Target of chapter options in chapter "${chapterName}" is not a chapter name: ${optionChapterName}`);
			
			// If the same optionChapterName appears more than once then while
			// it doesn't necessarily need to be an error, we still treat it as
			// such, since it's probably some copy/paste user error, as it
			// doesn't make sense to have it so
			assert(
				!(optionChapterName in options),
				`Chapter ${chapterName}: Option ${optionChapterName} appears more than once in the same choice string: ${os}`);
			
			options[optionChapterName] = Number(weight);
		});
		
		return options;
	}
	
	loadChapter(chapterName, advData) {
		let chapter = advData.chapters[chapterName];
		
		// Convert array short form to full object form
		if (Array.isArray(chapter)) {
			chapter = {
				parts: chapter,
			}
		}
		
		// Handle empty chapters
		if (!chapter.parts) {
			chapter.parts = [];
		}
		
		let points = chapter.points;
		let winningChapters = advData.winningChapters;
		let losingChapters = advData.losingChapters;
		
		// Default point values for winning and losing chapters
		if (points === undefined) {
			if (winningChapters && winningChapters.includes(chapterName)) {
				points = VICTORY_REWARD;
			}
			
			if (losingChapters && losingChapters.includes(chapterName)) {
				points = -LOSS_PENALTY;
			}
		}
		
		let choices = {};
		let parts = [];
		let matches = null;
		chapter.parts.forEach(part => {
			CHOICE_REGEX.lastIndex = 0;
			while (matches = CHOICE_REGEX.exec(part)) {
				// The user's choice should be in the element at index 1 (we
				// ignore surrounding spaces, multiple spaces and letter casing)
				let choiceString = this.toChoiceString(matches[1]);
				
				// A choice string (what the user writes) should only appear
				// once per chapter
				assert(
					!(choiceString in choices),
					`The choice string "${choiceString}" appears in chapter "${chapterName}" more than once!`);
				
				// The options of where we go if the user makes that choice
				// should be right after it, in the element at index 2
				let chapterOptions = matches[2];
				
				// If there isn't anything there, then the choice string itself
				// is also the name of the chapter we're supposed to proceed to
				// if the user selects this option, and if there is, then we
				// need to parse what we have to get the options and weights
				if (chapterOptions) {
					choices[choiceString] = this.parseChapterOptions(
						chapterOptions,
						chapterName,
						advData);
				} else {
					assert(
						choiceString in advData.chapters,
						`Choice "${choiceString}" in chapter "${chapterName}" is defined without a target, but there is no chapter by that name.`);
					
					choices[choiceString] = {
						[choiceString]: 1,
					};
				}
			}
			
			// Replace the structured choice definition with just the player's
			// options in brackets (e.g. turn the substring
			// 	"[jump:jumpSafe,jumpDeath] or [duck:duckSafe|1,duckDeath|3]?"
			// to
			// 	"[jump] or [duck]?")
			// 
			// Replacing the regex result with '$1' causes each match to be
			// replaced by the group in index 1 in the found match
			parts.push(part.replace(CHOICE_REGEX, '[$1]'));
		});
		
		// Every chapter that is an ending must be final (no choices or next)
		if ((winningChapters && winningChapters.includes(chapterName)) ||
			(losingChapters && losingChapters.includes(chapterName))) {
				assert(
					_.isEmpty(choices) && !chapter.next,
					`The chapter "${chapterName}" is a final chapter but it has choices!`);
		} else {
		// Every chapter that isn't an ending must either have a next chapter it
		// immediately goes to, or choices for when to go next (otherwise the
		// adventure would be stuck upon reaching it) - if there are choices
		// then there must be at least two of them (no point in only having one)
			if (chapter.next) {
				assert(
					_.isEmpty(choices),
					`The chapter "${chapterName}" has both a next chapter and choices, which isn't allowed!`);
			} else {
				assert(
					Object.keys(choices).length >= 2,
					`The chapter "${chapterName}" is not a final chapter but it has no next chapter or choices!`);
			}
		}
		
		let result = { choices, parts };
		if (points) {
			result.points = points;
		}
		
		if (chapter.next) {
			result.next = this.parseChapterOptions(
				chapter.next,
				chapterName,
				advData);
		}
		
		return result;
	}
	
	// Replaces all the placeholders we know in the given text with their
	// intended values.
	// 
	// Parameters:
	// 	text				The text to fill.
	// 	[userAdventure]		Details of a user's currently ongoing adventure.
	fillText(text, userAdventure) {
		let result = text;
		
		result = result.replace(REWARD_PLACEHOLDER, VICTORY_REWARD);
		result = result.replace(PENALTY_PLACEHOLDER, LOSS_PENALTY);
		
		if (userAdventure) {
			result = result.replace(USER_PLACEHOLDER, userAdventure.user.displayName);
			result = result.replace(TITLE_PLACEHOLDER, userAdventure.title);
		}
		
		return result;
	}
	
	// Shorthand for this.say(this.fillText(text, userAdventure)).
	fillSay(text, userAdventure) {
		this.say(this.fillText(text, userAdventure));
	}
	
	// Shorthand for this.say(target, this.fillText(text, userAdventure)).
	fillTell(target, text, userAdventure) {
		this.tell(target, this.fillText(text, userAdventure));
	}
	
	sayAdventureMessage(message, userAdventure) {
		this.fillSay(
			`[${userAdventure.user.displayName}'s Adventure] ${message}`,
			userAdventure);
	}
	
	sayPointDiffMessage(points, userAdventure) {
		if (!points) {
			return;
		}
		
		let message;
		if (points > 0) {
			message = `Rejoice! $player gains ${this.pointsString(points)} on their adventure!`;
		} else {
			message = `Oh no! $player loses ${this.pointsString(-points)} on their adventure!`;
		}
		
		this.fillSay(message, userAdventure);
	}
	
	// Selects a random adventure from our cache and returns it.
	getRandomAdventure() {
		return Utils.randomElement(this.adventureCache);
	}
	
	// Begins a new adventure.
	startAdventure(user) {
		// This is in case we've cancelled the adventure before it started
		if (this.activeAdventures[user.name]) {
			this.tell(user, "Hey! Do you think I'm stupid? You're already in the middle of an adventure here!");
			return;
		}
		
		// The getRandomAdventure() function only gives us the names of the
		// adventure and the category it's in, which we then use to get the
		// actual adventure data
		let advIDs = this.getRandomAdventure();
		let categoryData = this.categories[advIDs.category];
		let adventure = categoryData.adventures[advIDs.name];
		
		// This holds all the information needed to go through the adventure
		let userAdventure = {
			// Identifiers in case we want to access the full adventure data
			category: advIDs.category,
			name: advIDs.name,
			
			// The information on the adventure that we're actually going to use
			title: categoryData.title,
			chapters: adventure.chapters,
			startChapter: adventure.start,
			winningChapters: adventure.winningChapters,
			losingChapters: adventure.losingChapters,
			
			// Progress tracking (the values are redundant here since they'll
			// be set by startChapter momentarily, but we list them here with
			// their starting values for clarity)
			currentChapter: adventure.start,
			currentPart: 0,
			
			// Player-related variables
			user: user,
			waitingForChoice: false,
			
			// Handles obtained from setTimeout() and setInterval, to be used to
			// cancel invocation of things when they lose relevant
			timeoutHandle: null,
			reminderHandle: null,
		};
		
		// We save each adventure under the initiating user's name - that way we
		// can have adventures running concurrently for multiple people
		this.activeAdventures[user.name] = userAdventure;
		
		// Start the actual adventure, from the first chapter
		this.startChapter(userAdventure, userAdventure.startChapter);
	}
	
	startChapter(userAdventure, chapterName) {
		userAdventure.currentChapter = chapterName;
		userAdventure.currentPart = 0;
		
		let points = userAdventure.chapters[chapterName].points;
		if (points) {
			this.modifyUserPoints(userAdventure.user, points);
			this.sayPointDiffMessage(points, userAdventure);
		}
		
		// If a chapter is empty, we go straight to end it (empty chapters are
		// for making automatic decisions)
		if (userAdventure.chapters[chapterName].parts.length === 0) {
			this.endOfChapter(userAdventure);
		} else {
			// If it's not empty then we need to start showing each part
			this.nextPart(userAdventure);
		}
	}
	
	// Sends the next part of the user's adventure to the chat.
	nextPart(userAdventure) {
		userAdventure.reminderHandle = null;
		userAdventure.timeoutHandle = null;
		
		let chapter = userAdventure.chapters[userAdventure.currentChapter];
		
		this.sayAdventureMessage(
			chapter.parts[userAdventure.currentPart++],
			userAdventure);
		
		if (userAdventure.currentPart < chapter.parts.length) {
			// If we haven't reached the end of the chapter then schedule the
			// next part
			this.nextPartTimerHandle = setTimeout(
				() => this.nextPart(userAdventure),
				PARTS_PAUSE_LENGTH);
		} else {
			// Otherwise we start waiting for the user's choice, or end the
			// adventure, depending on what kind of chapter this is
			this.endOfChapter(userAdventure);
		}
	}
	
	endOfChapter(userAdventure) {
		let chapterName = userAdventure.currentChapter;
		if (userAdventure.winningChapters.includes(chapterName) ||
			userAdventure.losingChapters.includes(chapterName)) {
				// Handle final chapters
				this.endAdventure(userAdventure);
		} else if (userAdventure.chapters[chapterName].next) {
			// Handle chapters that specify another chapter that should
			// immediately follow them - but there should still be the standard
			// delay between parts
			this.nextPartTimerHandle = setTimeout(
				() => this.selectAndStartChapter(
					userAdventure,
					userAdventure.chapters[chapterName].next),
				PARTS_PAUSE_LENGTH);
		} else {
			// Wait for the user to enter their choice
			userAdventure.waitingForChoice = true;
			userAdventure.timeoutHandle = setTimeout(
				() => this.adventureTimedOut(userAdventure),
				PATIENCE);
			userAdventure.reminderHandle = setInterval(
				() => this.remind(userAdventure),
				REMINDER_INTERVAL);
		}
	}
	
	selectAndStartChapter(userAdventure, choices) {
		let nextChapterName = Utils.weightedRandomKey(choices);
		this.startChapter(userAdventure, nextChapterName);
	}
	
	processUserMessage(userAdventure, message) {
		if (userAdventure.waitingForChoice) {
			let choiceString = this.toChoiceString(message);
			let chapter = userAdventure.chapters[userAdventure.currentChapter];
			if (choiceString in chapter.choices) {
				userAdventure.waitingForChoice = false;
				this.clearTimers(userAdventure);
				
				this.selectAndStartChapter(
					userAdventure,
					chapter.choices[choiceString]);
			}
		}
	}
	
	clearTimers(userAdventure) {
		if (userAdventure.timeoutHandle) {
			clearTimeout(userAdventure.timeoutHandle);
			userAdventure.timeoutHandle = null;
		}
		
		if (userAdventure.reminderHandle) {
			clearInterval(userAdventure.reminderHandle);
			userAdventure.reminderHandle = null;
		}		
	}
	
	// Sends a timed reminder to the Twitch chat to tell the user to make his
	// choice.
	remind(userAdventure) {
		let reminderText = Utils.randomElement(REMINDER_MESSAGES);
		this.fillSay(reminderText, userAdventure);
	}
	
	adventureTimedOut(userAdventure) {
		let timeoutMessage = Utils.randomElement(TIMEOUT_MESSAGES);
		this.sayAdventureMessage(timeoutMessage, userAdventure);
		this.endAdventure(userAdventure);
	}
	
	// Ends the adventure, whether it's done or still taking place, no matter
	// which phase it's in.
	endAdventure(userAdventure) {
		// Clear timers that are meant to do stuff to continue the adventure
		this.clearTimers(userAdventure);
		
		// Mark that there is no active adventure
		delete this.activeAdventures[userAdventure.user.name];
	}
	
	userHasAdventure(user) {
		return user.name in this.activeAdventures;
	}
	
	// [Inherited, called externally]
	// Module entry point.
	load() {
		this.onTwitchEvent('message', (user, message) => {
			if (this.userHasAdventure(user)) {
				this.processUserMessage(
					this.activeAdventures[user.name],
					message);
			}
		});
	}
	
	commands = {
		['choose']: {
			name: 'Start Adventure',
			cmdname: 'choose',
			description: 'Starts a choose-your-own branching, solo adventure for the user.',
			callback: (user, category) => this.startAdventure(user, category),
		},
		
		['chickenout']: {
			name: 'Cancel Adventure',
			description: "Cancels the user's currently ongoing branching adventure.",
			callback: user => {
				if (this.userHasAdventure(user)) {
					this.tell(user, "Alright, if that's what you want... *Cluck*");
					this.endAdventure(this.activeAdventures[user.name]);
				}
			},
		}
	}
}

module.exports = new BranchingAdventure();
