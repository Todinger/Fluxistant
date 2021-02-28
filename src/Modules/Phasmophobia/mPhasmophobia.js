'use strict';

const assert = require('assert').strict;
const _ = require('lodash');
const Module = requireMain('module');
const Process = requireMain('process');
const Utils = requireMain('utils');

const GHOST_DATA_FILE = 'ghostData.json';

class Phasmophobia extends Module {
	constructor() {
		super({
			name: 'Phasmophobia',
			webname: 'phasmophobia',
			source: 'phasmophobia.html',
			tags: ['textdisp'],
		});
		
		this.ghostData = {};
		this.evidenceNames = {
			emf5:   "EMF 5",
			box:    "Spirit Box",
			prints: "Fingerprints",
			orb:    "Ghost Orb",
			book:   "Ghost Writing",
			temps:  "Freezing Temperatures",
		};
		
		// This variable is fully defined in this.clearEvidence()
		this.levelData = {};
		this.clearEvidence();
		
		this.game = new Process('Phasmophobia');
		this.game.onStarted(() => this.gameStarted());
		this.game.onExited(() => this.gameEnded());
	}
	
	get evidenceList() {
		return Object.keys(this.evidenceNames);
	}
	
	toEvidenceNames(evidenceList) {
		return evidenceList.map(ev => this.evidenceNames[ev]);
	}
	
	enable() {
		this.game.startMonitoring();
	}
	
	disable() {
		this.game.stopMonitoring();
	}
	
	defineModConfig(modConfig) {
		let chatMessages = modConfig.addGroup('chat')
			.setName('Chat Messages')
			.setDescription('Settings for which messages will be sent to the chat');
		chatMessages.addBoolean('evidence', false)
			.setName('Evidence')
			.setDescription('Makes the bot send information to the chat every time a piece of evidence is found');
		chatMessages.addBoolean('ghost', false)
			.setName('Final Ghost')
			.setDescription('Makes the bot send a message to the chat when the ghost is found saying what it is');
		chatMessages.addBoolean('newLevel', false)
			.setName('New Level')
			.setDescription('Makes the bot send a message to the chat when a new level is started');
		chatMessages.addBoolean('evidenceLeft', false)
			.setName('Evidence Left')
			.setDescription('Makes the bot say which types of evidence are still possible once two pieces have been acquired');
		chatMessages.addBoolean('badEvidence', false)
			.setName('Bad Evidence Warning')
			.setDescription('Makes the bot tag the streamer in a message if the evidence is faulty (i.e. if there are no possible ghosts for it)');
	}
	
	loadModConfig(conf) {
	}
	
	validateData(ghostData) {
		Object.values(ghostData).forEach(evList => {
			evList.forEach(ev => assert(
				this.evidenceList.includes(ev),
				`Unknown evidence in ghost data: ${ev}`));
		});
	}
	
	loadData() {
		let ghostData = this.readJSON(GHOST_DATA_FILE);
		this.validateData(ghostData);
		this.ghostData = ghostData;
	}
	
	buildEvidenceState() {
		let evidenceState = {};
		this.evidenceList.forEach(ev => {
			if (this.levelData.flags[ev]) {
				evidenceState[ev] = 'on';
			} else if (this.levelData.impossibleEvidence.includes(ev)) {
				evidenceState[ev] = 'invalid';
			} else {
				evidenceState[ev] = 'off';
			}
		});
		
		return evidenceState;
	}
	
	makeClientState() {
		return {
			ghostName: this.levelData.ghostName,
			evidence: this.buildEvidenceState(),
			possibleGhosts: this.levelData.possibleGhosts,
		};
	}
	
	updateClient() {
		let clientState = this.makeClientState();
		this.broadcastEvent('state', clientState);
	}
	
	gameStarted() {
		this.clearEvidence();
		this.broadcastEvent('show');
	}
	
	gameEnded() {
		this.broadcastEvent('hide');
	}
	
	ifRunning(callback) {
		return (...params) => {
			if (this.game.isRunning()) {
				callback(...params);
			}
		}
	}
	
	ifActive(callback) {
		return (...params) => {
			if (this.game.isActive()) {
				callback(...params);
			}
		}
	}
	
	clearEvidence() {
		this.levelData = {
			ghostName: null,
			flags: {
				emf5:   false,
				box:    false,
				prints: false,
				orb:    false,
				book:   false,
				temps:  false,
			},
			list: [],
			possibleGhosts: Object.keys(this.ghostData),
			possibleEvidenceLeft: this.evidenceList,
			impossibleEvidence: [],
		}
	}
	
	newLevel() {
		this.clearEvidence();
		this.updateClient();
		this.say('New level, people!');
	}
	
	ghostFound() {
		let ghost = this.levelData.possibleGhosts[0];
		this.broadcastEvent('showText', {
			text: `It's ${Utils.definiteSingularFor(ghost)}!`,
			style: 'Creepy',
			color: '#FFFFFF',
			duration: 5000,
		});
		
		if (this.config.chat.ghost) {
			this.say(`We've got it! The ghost must be ${Utils.definiteSingularFor(ghost)}!`);
		}
	}
	
	sayState() {
		if (this.levelData.list.length === 0) {
			this.say("We currently have no evidence yet. But we'll get there!");
			return;
		}
		
		this.say(`Current evidence: ${Utils.makeEnglishAndList(this.toEvidenceNames(this.levelData.list))}`);
		if (this.levelData.list.length === 2) {
			this.say(`Possible evidence left: ${Utils.makeEnglishAndList(this.toEvidenceNames(this.levelData.possibleEvidenceLeft))}.`);
		}
		
		let options = this.levelData.possibleGhosts;
		if (options.length === 0) {
			this.say("Well, actually, this evidence doesn't really fit any ghost... hehe...");
		} else if (options.length === 1) {
			this.say(`The ghost must be ${Utils.definiteSingularFor(options[0])}!`);
		} else {
			this.say(`The ghost type can be any of: ${Utils.makeEnglishOrList(options)}`);
		}
	}
	
	sayConciseState() {
		let messageParts = [];
		
		if (this.levelData.ghostName) {
			messageParts.push(`Name: ${this.levelData.ghostName}`);
		}
		
		if (Utils.inRange(1, this.levelData.possibleEvidenceLeft.length, 3)) {
			messageParts.push(`Possible Evidence: ${Utils.makeEnglishAndList(this.toEvidenceNames(this.levelData.possibleEvidenceLeft))}`);
		}
		
		if (this.levelData.possibleGhosts.length <= 3) {
			messageParts.push(`Ghost Type: ${Utils.makeEnglishOrList(this.levelData.possibleGhosts)}`)
		}
		
		if (messageParts.length > 0) {
			this.tellStreamer(messageParts.join(' / '));
		} else {
			this.tellStreamer("There isn't enough information yet for the current level.");
		}
	}
	
	evidenceChanged() {
		// Gets a list of pieces of evidence we have so far (i.e.
		// everything that's set to true in this.levelData.flags)
		this.levelData.list = this.evidenceList.filter(ev => this.levelData.flags[ev]);
		
		// Figure out the possible ghost types
		this.levelData.possibleGhosts = Object.keys(this.ghostData).filter(
			ghost => Utils.isArraySubset(this.levelData.list, this.ghostData[ghost]));
		
		// Figure out the possible remaining evidence
		let union = _.union.apply(null, this.levelData.possibleGhosts.map(ghost => this.ghostData[ghost]));
		this.levelData.possibleEvidenceLeft = _.difference(
			union,
			this.levelData.list);
		
		// List the piece(s) of evidence it *can't* be
		this.levelData.impossibleEvidence = _.difference(
			this.evidenceList,
			_.union(this.levelData.list, this.levelData.possibleEvidenceLeft));
		// Once two pieces of evidence are acquired we may want to announce this information
		if (this.levelData.list.length === 2 && this.config.chat.evidenceLeft) {
			this.say(`Possible evidence left: ${Utils.makeEnglishAndList(this.toEvidenceNames(this.levelData.possibleEvidenceLeft))} (no ${Utils.makeEnglishOrList(this.toEvidenceNames(this.levelData.impossibleEvidence))}).`);
		}
		
		let options = this.levelData.possibleGhosts;
		if (options.length === 0 && this.config.chat.badEvidence) {
			this.tellStreamer("Hey, something's wrong here! No ghost matches the evidence! Are you sure you got it right?");
		} else if (options.length === 1) {
			this.ghostFound();
		}
		
		this.updateClient();
	}
	
	addEvidence(evidence) {
		if (!this.levelData.flags[evidence]) {
			this.levelData.flags[evidence] = true;
			if (this.config.chat.evidence) {
				this.say(`${this.evidenceNames[evidence]} added as evidence! Use !evidence which ghosts it can be.`);
			}
			this.evidenceChanged();
		}
	}
	
	removeEvidence(evidence) {
		if (this.levelData.flags[evidence]) {
			this.levelData.flags[evidence] = false;
			if (this.config.chat.evidence) {
				this.say(`${this.evidenceNames[evidence]} removed as evidence! Use !evidence which ghosts it can be.`);
			}
			this.evidenceChanged();
		}
	}
	
	ghostNameCommand(user, ...name) {
		if (name.length === 0) {
			if (this.levelData.ghostName) {
				this.say(`The ghost's name is ${this.levelData.ghostName}.`);
			} else {
				this.say('A ghost has no name.');
			}
		} else if (user.isAtLeastMod) {
			this.levelData.ghostName = name.join(' ');
			this.say(`Ghost's name set to ${this.levelData.ghostName}.`);
			this.updateClient();
		}
	}
	
	guessGhost(user, ghost) {
	
	}
	
	load() {
		this.imageDirURL = this.registerAssetDir('Images', 'images');
		this.onClientAttached(socket => {
			let clientState = this.makeClientState();
			socket.emit('state', clientState);
			if (this.game.isRunning()) {
				socket.emit('show');
			}
		});
	}
	
	commands = {
		['name']: {
			name: "Set Ghost's Name",
			description: 'Adds the given evidence to the current level evidence',
			aliases: ['ghostname', 'gname'],
			filters: [this.filterDesc('isAtLeastMod')],
			callback: this.ifRunning((user, ...name) => this.ghostNameCommand(user, ...name)),
		},
		['evidence']: {
			name: 'Announce Evidence',
			description: 'Makes the bot say in the chat what the current evidence and possible ghosts are',
			aliases: ['ghosts', 'ghost'],
			callback: this.ifRunning(() => this.sayState()),
		},
		['addevidence']: {
			name: 'Add Evidence',
			description: 'Adds the given evidence to the current level evidence',
			aliases: ['addev', 'evidence+', 'ev+', '+ev', '+evidence'],
			filters: [this.filterDesc('isAtLeastMod')],
			callback: this.ifRunning((user, ev) => this.addEvidence(ev)),
		},
		['removeevidence']: {
			name: 'Remove Evidence',
			description: 'Remove the given evidence from the current level evidence',
			aliases: ['removeev', 'evidence-', 'ev-', '-ev', '-evidence'],
			filters: [this.filterDesc('isAtLeastMod')],
			callback: this.ifRunning((user, ev) => this.removeEvidence(ev)),
		},
		['guess']: {
			name: 'Guess',
			description: 'Guess what the ghost is going to be',
			callback: (user, ghost) => this.ifRunning(this.guessGhost(user, ghost)),
		},
	}
	
	shortcuts = {
		newLevel: {
			name: 'New Level',
			description: 'Removes all evidence and starts a new level',
			keys: [
				['BACKSPACE'], // The backspace key on the keyboard
			],
			callback: this.ifActive(() => this.newLevel()),
		},
		
		showInfo: {
			name: 'Show Information',
			description: 'Invokes the evidence message to the chat (same as using the !evidence command)',
			callback: this.ifActive(() => this.sayState()),
		},
		
		showConciseInfo: {
			name: 'Show Concise Information',
			description: 'Shows all the interesting information for the streamer in a single, concise message',
			keys: [
				['BACKQUOTE'],
			],
			callback: this.ifActive(() => this.sayConciseState()),
		},
		
		// --------- Evidence --------- //
		addEMF5: {
			name: 'Add Evidence: EMF Level 5',
			description: 'Adds EMF Level 5 as a piece of evidence for the current ghost',
			keys: [
				['1'], // The 1 key on the keyboard
			],
			callback: this.ifActive(() => this.addEvidence('emf5')),
		},
		removeEMF5: {
			name: 'Remove Evidence: EMF Level 5',
			description: 'Removes EMF Level 5 as a piece of evidence for the current ghost',
			keys: [
				['SHIFT_L', '1'], // Shift + 1
			],
			callback: this.ifActive(() => this.removeEvidence('emf5')),
		},
		addBox: {
			name: 'Add Evidence: Spirit Box',
			description: 'Adds Spirit Box as a piece of evidence for the current ghost',
			keys: [
				['2'], // The 2 key on the keyboard
			],
			callback: this.ifActive(() => this.addEvidence('box')),
		},
		removeBox: {
			name: 'Remove Evidence: Spirit Box',
			description: 'Removes Spirit Box as a piece of evidence for the current ghost',
			keys: [
				['SHIFT_L', '2'], // Shift + 2
			],
			callback: this.ifActive(() => this.removeEvidence('box')),
		},
		addPrints: {
			name: 'Add Evidence: Fingerprints',
			description: 'Adds Fingerprints as a piece of evidence for the current ghost',
			keys: [
				['3'], // The 3 key on the keyboard
			],
			callback: this.ifActive(() => this.addEvidence('prints')),
		},
		removePrints: {
			name: 'Remove Evidence: Fingerprints',
			description: 'Removes Fingerprints as a piece of evidence for the current ghost',
			keys: [
				['SHIFT_L', '3'], // Shift + 3
			],
			callback: this.ifActive(() => this.removeEvidence('prints')),
		},
		addOrb: {
			name: 'Add Evidence: Ghost Orb',
			description: 'Adds Ghost Orb as a piece of evidence for the current ghost',
			keys: [
				['4'], // The 4 key on the keyboard
			],
			callback: this.ifActive(() => this.addEvidence('orb')),
		},
		removeOrb: {
			name: 'Remove Evidence: Ghost Orb',
			description: 'Removes Ghost Orb as a piece of evidence for the current ghost',
			keys: [
				['SHIFT_L', '4'], // Shift + 4
			],
			callback: this.ifActive(() => this.removeEvidence('orb')),
		},
		addBook: {
			name: 'Add Evidence: Ghost Writing',
			description: 'Adds Ghost Writing as a piece of evidence for the current ghost',
			keys: [
				['5'], // The 5 key on the keyboard
			],
			callback: this.ifActive(() => this.addEvidence('book')),
		},
		removeBook: {
			name: 'Remove Evidence: Ghost Writing',
			description: 'Removes Ghost Writing as a piece of evidence for the current ghost',
			keys: [
				['SHIFT_L', '5'], // Shift + 5
			],
			callback: this.ifActive(() => this.removeEvidence('book')),
		},
		addTemps: {
			name: 'Add Evidence: Freezing Temperatures',
			description: 'Adds Freezing Temperatures as a piece of evidence for the current ghost',
			keys: [
				['6'], // The 6 key on the keyboard
			],
			callback: this.ifActive(() => this.addEvidence('temps')),
		},
		removeTemps: {
			name: 'Remove Evidence: Freezing Temperatures',
			description: 'Removes Freezing Temperatures as a piece of evidence for the current ghost',
			keys: [
				['SHIFT_L', '6'], // Shift + 6
			],
			callback: this.ifActive(() => this.removeEvidence('temps')),
		},
		// ---------------------------- //
	}
}

module.exports = new Phasmophobia();
