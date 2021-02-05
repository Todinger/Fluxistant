'use strict';

const assert = require('assert').strict;
const Module = require('../../module');
const Utils = require('../../utils');

// In the following, anywhere "botName" is mentioned, it can be either
// "Me", which represents our own bot, or "SE", which represents the
// StreamElements bot. Case-insensitive.
// 
// File structure:
//	{
//		conversations: {
//			name: CONVERSATION_DATA
//		}
//	}
// 
// (Conversation = full conversation between the two bots)
// Where CONVERSATION_DATA is either in the following structure:
//	{
//		startingBot: botName,	// optional
//		lineDuration: defaultTimeBetweenMessages, // optional
//		entries: [ENTRIES]
//	}
// or:
//	[ENTRIES]
// or:
//	[LINE_ENTRIES]
// 
// (Entry = Sequence of lines by one speaker (bot))
// Where ENTRIES is an array of entries, each of which either in the
// following structures:
//	{
//		speaker: botName, // optional
//		lineDuration: defaultTimeBetweenMessages, // optional
//		lines: [LINE_ENTRIES]
//	}
// or:
//	[LINE_ENTRIES]
// or:
//	LINE_ENTRY
// 
// (Line entry = A single line spoken by a bot)
// Where LINE_ENTRIES is a list of things the bot says, each of which is
// either in the following structure:
//	{
//		lineDuration: timeBeforeNextLineEntry, // optional
//		line: "What the bot will say here"
//	}
// or:
//	"What the bot will say here"
// 
// 
// Most of the above describes ways to shorten the data to make it easier
// to write conversations with default timings, while allowing more
// configuration if different durations are required.
// Eventually, whichever way the data is written, it will be expanded to the
// full format, e.g.:
// 
//	{
//		conversations: {
//			name: {
//				entries: [
//					{
//						speaker: botName,
//						lines: [
//							{
//								lineDuration: timeBeforeNextLineEntry,
//								line: "What the bot will say here"
//							},
//							...
//						]
//					},
//					...
//				]
//			},
//			...
//		}
//	}
// 
// Anything that isn't specified will default to either values specified (or
// derived from values specified) before or program defaults.
// This lets you also define a conversation quickly like so, if you use all
// the defaults:
//	{
//		conversations: {
//			lamejoke: [
//				"Knock, knock.",
//				"Who's there?",
//				"A little old lady.",
//				"A little old lady who?",
//				"Wow, I didn't know you could yodel!"
//			],
//		}
//	}
//	
// And if you want to separate something a bot says into two messages, you
// can just put them in an array instead of the line. Tatoeba:
//	{
//		conversations: {
//			lamejoke: [
//				"Knock, knock.",
//				"Who's there?",
//				"A little old lady.",
//				"A little old lady who?",
//				["Wow,", "I didn't know you could yodel!"], // Sends 2 messages
//			],
//		}
//	}
// 
const CONVERSATIONS_FILE = 'conversations.json';

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;

// Time to wait between conversations
const CONVERSATIONS_INTERVAL = {
	// BASE: 15 * SECONDS,
	// VARIANCE: 5 * SECONDS,
	BASE: 45 * MINUTES,
	VARIANCE: 10 * MINUTES,
}

// Represents us
const BOTNAME_SELF = 'Me';

// Represents the StreamElements bot conencted to our channel
const BOTNAME_STREAMELEMENTS = 'SE';

// Global defaults for conversations, in case they aren't provided in the
// conversation data
const DEFAULTS = {
	startingBot: BOTNAME_SELF,
	lineDuration: 5 * SECONDS,
};

// Represents a bot in the channel - either us or StreamElements.
class Bot {
	constructor(module) {
		this.module = module;
	}
	
	// Sends a message to the channel chat
	say(message) { throw 'Abstract function called.'; }
	
	// Gets the name of this bot
	get name() { throw 'Abstract function called.'; }
	
	// Gets the other bot in the chat (the actual Bot object, not the name)
	get other() { throw 'Abstract function called.'; }

	// Extra delay to put after a bot says something:
	// If one bot is slower than the other (contacting SE and having their
	// bot say something might take noticeably longer), add some time for
	// the slower bot to mitigate it
	get delay() { throw 'Abstract function called.'; }
	
	// Mostly for debugging to see which bot is which
	toString() {
		return `<${this.name}>`;
	}
}

// Keeps both bots and allows getting a bot from its name.
// For some reason using a plain global array for this didn't work well...
class BotManager {
	constructor() {
		this.bots = {};
	}
	
	register(bot) {
		this.bots[bot.name] = bot;
	}
	
	get(name) {
		return this.bots[name];
	}
}
var botManager = new BotManager();

// The full Bot object representing us.
class MeBot extends Bot {
	constructor(module) {
		super(module);
	}
	
	get name() { return BOTNAME_SELF; }
	get other() { return botManager.get(BOTNAME_STREAMELEMENTS); }
	get delay() { return 0; }
	
	say(message) {
		// this.module.say(`Fluxistant: ${message}`);
		this.module.say(message);
	}
}

// The full Bot object representing the StreamElements bot.
class SEBot extends Bot {
	constructor(module) {
		super(module);
	}
	
	get name() { return BOTNAME_STREAMELEMENTS; }
	get other() { return botManager.get(BOTNAME_SELF); }
	get delay() { return 0; }
	
	say(message) {
		// this.module.say(`StreamElements: ${message}`);
		this.module.sendSEMessage(message);
	}
}


// Bot Fight
// ---------
// Prints scritped "arguments" between us and StreamElements to the chat
// occationally.
// 
// The conversations are all defined in CONVERSATIONS_FILE.
// See the comment for that constant for the structure of the file.
class BotFight extends Module {
	constructor() {
		super({
			name: 'Bot Fight',
			// debug: true,
			enabled: false,
		});
		
		this.conversations = {};
		this.activeConversation = null;
		
		this.active = true;
	}
	
	// --------------------------------------------------------------------- //
	// ------------------------- CONVERSATION DATA ------------------------- //
	// --------------------------------------------------------------------- //
	// Since each part of the conversation data file supports a lot of defaults
	// in order to allow easy writing while also supporting high
	// configurability, there is a separate function for loading each type of
	// part, both single and multiple.
	// These are listed from here in descending order into the conversation data
	// object.
	// The process starts at the top level with the conversations file and
	// drills down to the "leaves" which are line entries.
	// Anything that isn't in the data of a certain level is filled with the
	// defaults of the previous level (the topmost level uses the global
	// DEFAULTS constant). Any value present in a level overrides the
	// corresponding defaults from the previous level.
	
	// [Inherited, called externally]
	// 
	// Loads the entire file.
	// This is an entry point which simply reads the file from disk and passes
	// the contents on to the function that deals with the topmost level,
	// loadConversations().
	// 
	// Final result:
	// this.conversations = <Conversations Collection>
	loadData() {
		let data = this.readJSON(CONVERSATIONS_FILE);
		this.conversations = this.loadConversations(data.conversations);
		this.log('Conversations loaded.');
	}
	
	// Loads the conversations from direct file data.
	// 
	// Returns a <Conversations Collection>.
	// Final structure:
	// 	{
	// 		conversationName: <Conversation Object>,
	// 		...
	// 	}
	loadConversations(conversations) {
		let result = {};
		// Load each conversation, using our global defaults for what's missing
		Object.keys(conversations).forEach(name => {
			result[name] = this.loadConversation(
				conversations[name],
				DEFAULTS);
		});
		
		return result;
	}
	
	// Loads a single conversation.
	// 
	// Returns a <Conversation Object>.
	// Final structure:
	// 	{
	// 		entries: <Entries List>
	// 	}
	loadConversation(conversation, defaults) {
		if (Array.isArray(conversation)) {
			return {
				entries: this.loadEntries(conversation, defaults),
			};
		} else {
			let entriesDefaults = {
				startingBot: conversation.startingBot,
				lineDuration: conversation.lineDuration,
			};
			
			Utils.applyDefaults(entriesDefaults, defaults);
			
			return {
				entries: this.loadEntries(conversation.entries, entriesDefaults),
			}
		}
	}
	
	// Loads all the given entries.
	// 
	// Returns an <Entries List>.
	// Final structure:
	// 	[
	// 		<Entry Object>,
	// 		<Entry Object>,
	// 		...
	// 	]
	loadEntries(entries, defaults) {
		assert(
			Array.isArray(entries),
			`Invalid entries collection: expected array, got: ${entries}`);
		
		let result = [];
		let speaker = defaults.startingBot;
		
		entries.forEach(entry => {
			let entryDefaults = {
				speaker: speaker,
				lineDuration: defaults.lineDuration,
			};
			
			let resultEntry = this.loadEntry(entry, entryDefaults);
			
			speaker = botManager.get(resultEntry.speaker).other.name;
			result.push(resultEntry);
		});
		
		return result;
	}
	
	// Loads a single entry.
	// 
	// Returns an <Entry Object>.
	// Final structure:
	// 	{
	// 		speaker: botName,
	// 		lines: <Lines List>
	// 	}
	loadEntry(entry, defaults) {
		let result = null;
		if (Array.isArray(entry)) { // List of line entries
			let lineEntryDefaults = {
				lineDuration: defaults.lineDuration,
			};
			
			result = {
				speaker: defaults.speaker,
				lines: this.loadLineEntries(entry, lineEntryDefaults),
			};
		} else if (Utils.isObject(entry)) { // Either an entry or a line entry
			result = {
				speaker: entry.speaker || defaults.speaker,
			};
			
			let lineEntryDefaults = {
				lineDuration: entry.lineDuration || defaults.lineDuration,
			};
			
			if (entry.lines) { // Entry object
				assert(
					Array.isArray(entry.lines),
					`Invalid entry lines: expected array, got: ${entry.lines}`);
				
				result.lines = this.loadLineEntries(
					entry.lines,
					lineEntryDefaults);
			} else if (entry.line) { // Line entry object
				// Only one line entry in this case (array with one element)
				result.lines = [
					this.loadLineEntry(
						entry.line,
						lineEntryDefaults)
				];
			}
		} else if (typeof entry === 'string') { // A single line entry
			let lineEntryDefaults = {
				lineDuration: defaults.lineDuration,
			};
			
			result = {
				speaker: defaults.speaker,
				lines: [ this.loadLineEntry(entry, lineEntryDefaults) ],
			};
		} else {
			throw `Failed to parse entry: ${entry}`;
		}
		
		return result;
	}
	
	// Loads all the given lines.
	// 
	// Returns a <Lines List>.
	// Final structure:
	// 	[
	// 		<Line Object>,
	// 		<Line Object>,
	// 		...
	// 	]
	loadLineEntries(lineEntries, defaults) {
		assert(
			Array.isArray(lineEntries),
			`Invalid line entries collection: expected array, got: ${lineEntries}`);
		
		return lineEntries.map(
			lineEntry => this.loadLineEntry(lineEntry, defaults));
	}
	
	// Loads a single line.
	// Eventually all the data, however it is given, is distilled into lines and
	// delays.
	// Lines are *always* listed in the Line Object, but the lineDuration can be
	// taken from somewhere else - more precisely, the value of lineDuration for
	// any specific line will always be equal to the first lineDuration setting
	// found when climbing up the tree to the root "conversations" object (and
	// if there are none then it's taken from the global DEFAULTS constant).
	// 
	// Returns a <Line Object>.
	// Final structure:
	// 	{
	// 		line: "Text to send",
	// 		lineDuration: delayAfterSending
	// 	}
	loadLineEntry(lineEntry, defaults) {
		let le = {};
		
		if (typeof lineEntry === 'string') {
			le.line = lineEntry;
		} else if (Utils.isObject(lineEntry)) {
			assert(
				lineEntry.line && (typeof lineEntry.line === 'string'),
				`Bad line entry: expected string line, got: ${lineEntry.line}`);
			
			le.line = lineEntry.line;
			le.lineDuration = lineEntry.lineDuration;
		} else {
			throw `Bad line entry: expected string or object, got: ${lineEntry}`;
		}
		
		Utils.applyDefaults(le, defaults);
		return le;
	}
	
	// --------------------------------------------------------------------- //
	// ----------------------- CONVERSATION DATA END ----------------------- //
	// --------------------------------------------------------------------- //
	
	// Schedules a timed call to startRandomConversation based on out
	// conversation interval times.
	scheduleNextConversation() {
		setTimeout(
			() => this.startRandomConversation(),
			Utils.randomInRadius(
				CONVERSATIONS_INTERVAL.BASE,
				CONVERSATIONS_INTERVAL.VARIANCE));
	}
	
	// Starts a random conversation (right now).
	startRandomConversation() {
		if (this.active) {
			let conversationName = Utils.randomKey(this.conversations);
			this.startConversation(conversationName);
		}
	}
	
	// Starts a conversation with the given name.
	// 
	// Parameters:
	// 	conversationName	The name of... well, guess. <_<
	startConversation(conversationName) {
		if (this.activeConversation) {
			this.error('There is already a conversation taking place.');
			return;
		}
		
		// When this.activeConversation !== null, a conversation is taking place
		this.activeConversation = {
			// Covnersation name, the key in our conversations collection
			name: conversationName,
			
			// The entries of the conversations, which contain all the speech
			// data
			entries: this.conversations[conversationName].entries,
			
			// Index of the current entry in the entries array
			currentEntryIndex: 0,
			
			// Index of the current line in the entry array (an entry is an
			// array of lines)
			currentLineIndex: 0,
		}
		
		// Show the next (first) line
		this.nextLine();
	}
	
	// Sends the next line to the chat.
	// 
	// Assumes that the current conversation data points to a valid line in a
	// valid entry.
	// After sending, advances the indices and determines when to stop.
	nextLine() {
		assert(this.activeConversation, 'No conversation is active!');
		
		let ac = this.activeConversation;
		
		// Assuming that the conversation data is ok, this should actually never
		// happen
		if (ac.currentEntryIndex === ac.entries.length) {
			this.endConversation();
			return;
		}
		
		// Current entry, a collection of lines
		let entry = ac.entries[ac.currentEntryIndex];
		
		// The one who is to say the current line
		let speakerBot = botManager.get(entry.speaker);
		
		// The actual line to say - contains the text and how long it should
		// take to "say" it
		let lineEntry = entry.lines[ac.currentLineIndex++];
		
		// Send the line to the chat
		speakerBot.say(lineEntry.line);
		
		// Determine what to do next
		let nextFunc;
		if (ac.currentLineIndex === entry.lines.length) {
			// Reached the end of the current entry
			ac.currentEntryIndex++;
			if (ac.currentEntryIndex === ac.entries.length) {
				// Reached the end of the conversation
				nextFunc = () => this.endConversation();
			} else {
				// Time for the next entry
				ac.currentLineIndex = 0;
				nextFunc = () => this.nextLine();
			}
		} else {
			// We still have more lines to read in this entry
			nextFunc = () => this.nextLine();
		}
		
		// Schedule the next thing we want to do to happen after the delay of
		// the bot "saying" the line
		setTimeout(nextFunc, lineEntry.lineDuration + speakerBot.delay);
	}
	
	// Ends the current conversation and schedules the next one
	endConversation() {
		this.activeConversation = null;
		this.scheduleNextConversation();
	}
	
	// [Inherited, called externally]
	// Module entry point.
	load() {
		if (this.active) {
			this.scheduleNextConversation();
		}
	}
	
	commands = {
		['botfight']: {
			name: 'Start Conversation',
			cmdname: 'botfight',
			description: 'Makes the bots initiate a random conversation.',
			filters: [this.filterDesc('isOneOf', ['yecatsmailbox', 'fluxistence'])],
			callback: () => {
				if (!this.active) {
					this.active = true;
					this.startRandomConversation();
				}
			},
		}
	}
}

var bf = new BotFight();

// Create and register the Bot objects (they need the Module object we just
// defined, bf, which is why we do it all the way down here)
var meBot = new MeBot(bf);
var seBot = new SEBot(bf);
botManager.register(meBot);
botManager.register(seBot);

module.exports = bf;
