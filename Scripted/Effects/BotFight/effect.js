'use strict';

const assert = require('assert').strict;
const Effect = require('../../effect');
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

const BOTS = {
	Me: 'Me',
	SE: 'SE',
	
	Other: function(botName) {
		if (botName.toLowerCase() === BOTS.Me.toLowerCase()) {
			return BOTS.SE;
		} else {
			return BOTS.Me;
		}
	}
}

const DEFAULTS = {
	startingBot: BOTS.Me,
	lineDuration: 5 * SECONDS,
};

class BotFight extends Effect {
	constructor() {
		super({
			name: 'Bot Fight',
			debug: true,
		});
		
		this.conversations = {};
	}
	
	loadData() {
		let data = this.readJSON(CONVERSATIONS_FILE);
		this.conversations = this.loadConversations(data.conversations);
		
		console.log(require('util').inspect(this.conversations, false, null, true));
		
		this.log('Conversations loaded.');
	}
	
	loadConversations(conversations) {
		let result = {};
		Object.keys(conversations).forEach(name => {
			result[name] = this.loadConversation(
				conversations[name],
				DEFAULTS);
		});
		
		return result;
	}
	
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
			
			speaker = BOTS.Other(resultEntry.speaker);
			result.push(resultEntry);
		});
		
		return result;
	}
	
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
	
	loadLineEntries(lineEntries, defaults) {
		assert(
			Array.isArray(lineEntries),
			`Invalid line entries collection: expected array, got: ${lineEntries}`);
		
		return lineEntries.map(
			lineEntry => this.loadLineEntry(lineEntry, defaults));
	}
	
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
	
	load() {
	}
}

module.exports = new BotFight();
