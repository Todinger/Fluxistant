'use strict';

const assert = require('assert').strict;
const _ = require('lodash');
const Module = requireMain('module');
const Process = requireMain('process');
const Utils = requireMain('utils');

const GHOST_DATA_FILE = 'ghostData.json';
const GAME_TITLE = 'Phasmophobia';

const MAX_WINNERS_IN_MESSAGE = 5;

const CONFIG_DEFAULTS = {
	correctionFactor: 0.5,
	reward: 5000,
	delayBeforeResults: 5000, // 5 seconds
};

const DESCRIPTION =
`Adds a widget that can be placed in the overlay for the Phasmophobia game.

This widget can keep track of the evidence you collect, which possible evidence
and ghost type remain, the ghost's name and the final ghost type.

You add/remove evidence using the functions. These are set to some commands and
keyboard shortcuts by default, but you can change those.

Possible evidence names (which are used by the command and shortcuts) are: \`emf5\`, \`box\`, \`prints\`, \`orb\`, \`book\` and \`temps\`.

To add the overlay to your stream, add a browser source and set it to:
http://localhost:3333/mod/phasmophobia/phasmophobia.html

(Note: the port 3333 is the default one, but if you change it in the main settings,
you will need to adjust that address accordingly.`;

class Phasmophobia extends Module {
	constructor() {
		super({
			name: 'Phasmophobia',
			webname: 'phasmophobia',
			source: 'phasmophobia.html',
			tags: ['textdisp'],
			description: DESCRIPTION,
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
		
		// Viewer guessing games data
		this.guesses = {};
		
		this.game = new Process('Phasmophobia');
		this.game.onStarted(() => this.gameStarted());
		this.game.onExited(() => this.gameEnded());
	}
	
	get levelFinished() {
		return this.levelData.list.length === 3;
	}
	
	get badEvidence() {
		return this.levelData.possibleGhosts.length === 0;
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
		chatMessages.addBoolean('evidence', true)
			.setName('Evidence')
			.setDescription('Makes the bot send information to the chat every time a piece of evidence is found');
		chatMessages.addBoolean('ghost', true)
			.setName('Final Ghost')
			.setDescription('Makes the bot send a message to the chat when the ghost is found saying what it is');
		chatMessages.addBoolean('newLevel', true)
			.setName('New Level')
			.setDescription('Makes the bot send a message to the chat when a new level is started');
		chatMessages.addBoolean('evidenceLeft', true)
			.setName('Evidence Left')
			.setDescription('Makes the bot say which types of evidence are still possible once two pieces have been acquired');
		chatMessages.addBoolean('badEvidence', true)
			.setName('Bad Evidence Warning')
			.setDescription('Makes the bot tag the streamer in a message if the evidence is faulty (i.e. if there are no possible ghosts for it)');
		
		let guessingGame = modConfig.addGroup('guessingGame')
			.setName('Guessing Game')
			.setDescription('Parameters for the interactive viewer Guess-the-Ghost game');
		// guessingGame.addNaturalNumber('cost')
		// 	.setName('Participation Cost')
		// 	.setDescription('How many points a user needs to spend to participate');
		guessingGame.addNaturalNumber('reward', CONFIG_DEFAULTS.reward)
			.setName('Reward')
			.setDescription('How many points a user wins if correct - this is multiplied by the correction factor for late guesses');
		guessingGame.addNonNegativeNumber('correctionFactor', CONFIG_DEFAULTS.correctionFactor)
			.setName('Correction Factor')
			.setDescription('How much the reward is multiplied by if some evidence is already present when guessing (squared for 2 pieces)')
			.setHelp(`This should be a number between 0-1 (not forced, but recommended).
Its purpose is to reduce the winning prize when guessing once some pieces of evidence are found.
For example, if set to 0.5, then if a player guesses the ghost correctly before any evidence is collected, they'll get 100% of the prize. If they guessed when one piece of evidence had already been found, they'd get 50% of the prize. If two pieces had been found, they'd get 25% of the prize.
If this is set to 1 then reward amounts will not be affected by the amount of evidence present when making the guess.`);
		guessingGame.addNonNegativeNumber('delayBeforeResults', CONFIG_DEFAULTS.delayBeforeResults)
			.setName('Delay Before Results')
			.setDescription('How many seconds the bot should wait between announcing the ghost type and announcing the winners (this is to keep from flooding the chat)');
	}
	
	loadModConfig(conf) {
		Utils.applyDefaults(conf, CONFIG_DEFAULTS);
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
	
	findGhost(ghostName) {
		if (ghostName) {
			ghostName = ghostName.trim().toLowerCase();
			for (let ghost in this.ghostData) {
				if (ghostName === ghost.trim().toLowerCase()) {
					return ghost;
				}
			}
		}
		
		return null;
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
			name: this.levelData.ghostName,
			evidence: this.buildEvidenceState(),
			possibleGhosts: this.levelData.possibleGhosts,
			ghost: this.levelFinished ? this.levelData.possibleGhosts[0] : undefined,
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
	
	clearGuesses() {
		this.guesses = {};
	}
	
	newLevel() {
		this.clearEvidence();
		this.clearGuesses();
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
		
		// Announce the victors in the guessing game after a bit of delay to
		// keep from flooding the chat with messages
		setTimeout(
			() => this.finishGuessingGame(),
			this.config.guessingGame.delayBeforeResults);
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
			messageParts.push(this.levelData.ghostName);
		}
		
		if (this.badEvidence) {
			messageParts.push(`BAD EVIDENCE: ${this.toEvidenceNames(this.levelData.list)}`)
		} else if (this.levelFinished) {
			messageParts.push(
				`${this.toEvidenceNames(this.levelData.list).join(' + ')} = ${this.levelData.possibleGhosts[0]}`);
		} else {
			if (this.levelData.possibleEvidenceLeft.length <= 3) {
				messageParts.push(Utils.makeEnglishOrList(this.toEvidenceNames(this.levelData.possibleEvidenceLeft)));
			}
			
			if (this.levelData.possibleGhosts.length <= 3) {
				messageParts.push(Utils.makeEnglishOrList(this.levelData.possibleGhosts));
			}
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
			// I split this to multiple lines even though it's just message
			// because the line was way too long otherwise
			let statusMessage = '';
			statusMessage += 'Possible evidence left: ';
			statusMessage += Utils.makeEnglishAndList(this.toEvidenceNames(this.levelData.possibleEvidenceLeft));
			statusMessage += ' (no ';
			statusMessage += Utils.makeEnglishOrList(this.toEvidenceNames(this.levelData.impossibleEvidence));
			statusMessage += ').';
			statusMessage += ' Ghost type: ';
			statusMessage += Utils.makeEnglishOrList(this.levelData.possibleGhosts);
			statusMessage += '.';
			this.say(statusMessage);
			// this.say(`Possible evidence left: ${Utils.makeEnglishAndList(this.toEvidenceNames(this.levelData.possibleEvidenceLeft))} (no ${Utils.makeEnglishOrList(this.toEvidenceNames(this.levelData.impossibleEvidence))}).`);
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
		if (!(evidence in this.levelData.flags)) {
			this.say(`Unknown evidence ID. Please enter one of the following: ${Object.keys(this.levelData.flags).join(', ')}`);
			return;
		}
		
		if (!this.levelData.flags[evidence]) {
			this.levelData.flags[evidence] = true;
			if (this.config.chat.evidence) {
				this.say(`${this.evidenceNames[evidence]} added as evidence! Use !evidence to see which ghosts it can be.`);
			}
			this.evidenceChanged();
		}
	}
	
	removeEvidence(evidence) {
		if (!(evidence in this.levelData.flags)) {
			this.say(`Unknown evidence ID. Please enter one of the following: ${Object.keys(this.levelData.flags).join(', ')}`);
			return;
		}
		
		if (this.levelData.flags[evidence]) {
			this.levelData.flags[evidence] = false;
			if (this.config.chat.evidence) {
				this.say(`${this.evidenceNames[evidence]} removed as evidence! Use !evidence to see which ghosts it can be.`);
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
		if (this.badEvidence) {
			this.tell(user, `Maybe wait with that until ${this.getStreamerName()} fixes the evidence, since it doesn't fit any ghost right now...`);
		} else if (this.levelFinished) {
			this.tell(user, "It's too late to enter a guess now - we already know what the ghost is!");
		} else {
			if (!ghost) {
				if (user.name in this.guesses) {
					this.tell(user, `You guessed that the ghost would be ${Utils.definiteSingularFor(this.guesses[user.name].ghost)}.`);
				} else {
					this.tell(user, `Please also enter a ghost type to make your guess. The options are: ${this.levelData.possibleGhosts.join(', ')}`);
				}
				
				return;
			}
			
			if (user.name in this.guesses) {
				this.tell(
					user,
					`You've already entered a guess for this level (${this.guesses[user.name].ghost}).`);
				return;
			}
			
			ghost = this.findGhost(ghost);
			if (!ghost) {
				this.tell(
					user,
					`Unknown ghost type. Please enter one of the following: ${this.levelData.possibleGhosts.join(', ')}`);
				return;
			}
			
			if (!this.levelData.possibleGhosts.includes(ghost)) {
				this.tell(
					user,
					`It can't be ${Utils.definiteSingularFor(ghost)}! These are the current options: ${Utils.makeEnglishOrList(this.levelData.possibleGhosts)}`);
				return;
			}
			
			this.guesses[user.name] = {
				user,
				ghost,
				numEvidencePresent: this.levelData.list.length,
			};
			
			let addendum = '';
			let factor = this.config.guessingGame.correctionFactor;
			if (this.levelData.list.length === 1) {
				factor = Math.round(factor * 100);
				addendum = ` with one piece of evidence present (${factor}% payout)`;
			} else if(this.levelData.list.length === 2) {
				factor = Math.round(factor * factor * 100);
				addendum = ` with two pieces of evidence present (${factor}% payout)`;
			}
			
			this.tell(user, `Entered guess for ${ghost}${addendum}.`)
		}
	}
	
	finishGuessingGame() {
		let finalGhost = this.levelData.possibleGhosts[0];
		let winners = Object.keys(this.guesses).filter(
			username => this.guesses[username].ghost === finalGhost);
		
		let winnerNum = 0;
		let winMessages = [];
		winners.forEach(username => {
			let guessData = this.guesses[username];
			let amountFactor = Math.pow(
				this.config.guessingGame.correctionFactor,
				guessData.numEvidencePresent);
			let winAmount = Math.round(this.config.guessingGame.reward * amountFactor);
			this.modifyUserPoints(guessData.user, winAmount).then().catch();
			
			if (winnerNum++ < MAX_WINNERS_IN_MESSAGE) {
				winMessages.push(`${guessData.user.displayName} (${this.pointsString(winAmount)})`);
			}
		});
		
		if (winMessages.length > 0) {
			this.say(`Winners: ${winMessages.join(', ')}`);
		} else if (Object.keys(this.guesses).length > 0) {
			this.say('Sorry, no correct guesses for this one. Butter luck next time!');
		}
	}
	
	load() {
		this.registerAssetDir('Images', 'images');
		this.onClientAttached(socket => {
			let clientState = this.makeClientState();
			socket.emit('state', clientState);
			if (this.game.isRunning()) {
				socket.emit('show');
			}
		});
	}
	
	functions = {
		name: {
			name: "Set Ghost's Name",
			description: 'Adds the given evidence to the current level evidence',
			triggers: [
				this.trigger.command({
					cmdname: 'name',
					aliases: ['ghostname', 'gname'],
					filters: [this.filter.isMod()],
				}),
			],
			parameters: [
				{
					name: 'Ghost Name',
					takeAll: true,
				},
			],
			filters: [this.filter.windowRunning(GAME_TITLE)],
			action: data => this.ghostNameCommand(data.user, data.firstParam),
		},
		
		evidence: {
			name: 'Announce Evidence',
			description: 'Makes the bot say in the chat what the current evidence and possible ghosts are',
			triggers: [
				this.trigger.command({
					cmdname: 'evidence',
					aliases: ['ghosts', 'ghost'],
				}),
			],
			filters: [this.filter.windowRunning({
				title: GAME_TITLE
			})],
			action: () => this.sayState(),
		},
		
		addEvidence: {
			name: 'Add Evidence',
			description: 'Adds the given evidence to the current level evidence',
			triggers: [
				this.trigger.command({
					cmdname: 'addevidence',
					aliases: ['addev', 'evidence+', 'ev+', '+ev', '+evidence'],
					filters: [this.filter.isMod()],
				}),
				this.trigger.shortcut({
					keys: [['1']],
					paramValues: ['emf5'],
					filters: [this.filter.windowActive(GAME_TITLE)],
				}),
				this.trigger.shortcut({
					keys: [['2']],
					paramValues: ['box'],
					filters: [this.filter.windowActive(GAME_TITLE)],
				}),
				this.trigger.shortcut({
					keys: [['3']],
					paramValues: ['prints'],
					filters: [this.filter.windowActive(GAME_TITLE)],
				}),
				this.trigger.shortcut({
					keys: [['4']],
					paramValues: ['orb'],
					filters: [this.filter.windowActive(GAME_TITLE)],
				}),
				this.trigger.shortcut({
					keys: [['5']],
					paramValues: ['book'],
					filters: [this.filter.windowActive(GAME_TITLE)],
				}),
				this.trigger.shortcut({
					keys: [['6']],
					paramValues: ['temps'],
					filters: [this.filter.windowActive(GAME_TITLE)],
				}),
			],
			filters: [this.filter.windowRunning(GAME_TITLE)],
			action: data => this.addEvidence(data.firstParam),
		},
		
		removeEvidence: {
			name: 'Remove Evidence',
			description: 'Remove the given evidence from the current level evidence',
			triggers: [
				this.trigger.command({
					cmdname: 'removeevidence',
					aliases: ['removeev', 'evidence-', 'ev-', '-ev', '-evidence'],
					filters: [this.filter.isMod()],
				}),
				this.trigger.shortcut({
					keys: [['SHIFT_L', '1']],
					paramValues: ['emf5'],
					filters: [this.filter.windowActive(GAME_TITLE)],
				}),
				this.trigger.shortcut({
					keys: [['SHIFT_L', '2']],
					paramValues: ['box'],
					filters: [this.filter.windowActive(GAME_TITLE)],
				}),
				this.trigger.shortcut({
					keys: [['SHIFT_L', '3']],
					paramValues: ['prints'],
					filters: [this.filter.windowActive(GAME_TITLE)],
				}),
				this.trigger.shortcut({
					keys: [['SHIFT_L', '4']],
					paramValues: ['orb'],
					filters: [this.filter.windowActive(GAME_TITLE)],
				}),
				this.trigger.shortcut({
					keys: [['SHIFT_L', '5']],
					paramValues: ['book'],
					filters: [this.filter.windowActive(GAME_TITLE)],
				}),
				this.trigger.shortcut({
					keys: [['SHIFT_L', '6']],
					paramValues: ['temps'],
					filters: [this.filter.windowActive(GAME_TITLE)],
				}),
			],
			filters: [this.filter.windowRunning(GAME_TITLE)],
			action: this.ifRunning(data => this.removeEvidence(data.firstParam)),
		},
		
		guess: {
			name: 'Guess',
			description: 'Guess what the ghost is going to be',
			triggers: [
				this.trigger.command({
					cmdname: 'guess',
				}),
			],
			filters: [this.filter.windowRunning(GAME_TITLE)],
			action: data => this.guessGhost(data.user, data.firstParam),
		},
		
		newLevel: {
			name: 'New Level',
			description: 'Removes all evidence and starts a new level',
			triggers: [
				this.trigger.shortcut({
					keys: [
						['BACKSPACE'], // The backspace key on the keyboard
					],
					filters: [this.filter.windowActive(GAME_TITLE)],
				})
			],
			action: () => this.newLevel(),
		},
		
		showInfo: {
			name: 'Show Information',
			description: 'Invokes the evidence message to the chat (same as using the !evidence command)',
			filters: [this.filter.windowRunning(GAME_TITLE)],
			action: () => this.sayState(),
		},
		
		showConciseInfo: {
			name: 'Show Concise Information',
			description: 'Shows all the interesting information for the streamer in a single, concise message',
			triggers: [
				this.trigger.shortcut({
					keys: [
						['BACKQUOTE'], // The backspace key on the keyboard
					],
					filters: [this.filter.windowActive(GAME_TITLE)],
				})
			],
			action: () => this.sayConciseState(),
		},
/*
		
		// --------- Evidence --------- //
		addEMF5: {
			name: 'Add Evidence: EMF Level 5',
			description: 'Adds EMF Level 5 as a piece of evidence for the current ghost',
			triggers: [
				this.trigger.shortcut({
					keys: [
						['1'], // The 1 key on the keyboard
					],
				})
			],
			action: this.ifActive(() => this.addEvidence('emf5')),
		},
		removeEMF5: {
			name: 'Remove Evidence: EMF Level 5',
			description: 'Removes EMF Level 5 as a piece of evidence for the current ghost',
			triggers: [
				this.trigger.shortcut({
					keys: [
						['SHIFT_L', '1'], // Shift + 1
					],
				})
			],
			action: this.ifActive(() => this.removeEvidence('emf5')),
		},
		addBox: {
			name: 'Add Evidence: Spirit Box',
			description: 'Adds Spirit Box as a piece of evidence for the current ghost',
			triggers: [
				this.trigger.shortcut({
					keys: [
						['2'], // The 2 key on the keyboard
					],
				})
			],
			action: this.ifActive(() => this.addEvidence('box')),
		},
		removeBox: {
			name: 'Remove Evidence: Spirit Box',
			description: 'Removes Spirit Box as a piece of evidence for the current ghost',
			triggers: [
				this.trigger.shortcut({
					keys: [
						['SHIFT_L', '2'], // Shift + 2
					],
				})
			],
			action: this.ifActive(() => this.removeEvidence('box')),
		},
		addPrints: {
			name: 'Add Evidence: Fingerprints',
			description: 'Adds Fingerprints as a piece of evidence for the current ghost',
			triggers: [
				this.trigger.shortcut({
					keys: [
						['3'], // The 3 key on the keyboard
					],
				})
			],
			action: this.ifActive(() => this.addEvidence('prints')),
		},
		removePrints: {
			name: 'Remove Evidence: Fingerprints',
			description: 'Removes Fingerprints as a piece of evidence for the current ghost',
			triggers: [
				this.trigger.shortcut({
					keys: [
						['SHIFT_L', '3'], // Shift + 3
					],
				})
			],
			action: this.ifActive(() => this.removeEvidence('prints')),
		},
		addOrb: {
			name: 'Add Evidence: Ghost Orb',
			description: 'Adds Ghost Orb as a piece of evidence for the current ghost',
			triggers: [
				this.trigger.shortcut({
					keys: [
						['4'], // The 4 key on the keyboard
					],
				})
			],
			action: this.ifActive(() => this.addEvidence('orb')),
		},
		removeOrb: {
			name: 'Remove Evidence: Ghost Orb',
			description: 'Removes Ghost Orb as a piece of evidence for the current ghost',
			triggers: [
				this.trigger.shortcut({
					keys: [
						['SHIFT_L', '4'], // Shift + 4
					],
				})
			],
			action: this.ifActive(() => this.removeEvidence('orb')),
		},
		addBook: {
			name: 'Add Evidence: Ghost Writing',
			description: 'Adds Ghost Writing as a piece of evidence for the current ghost',
			triggers: [
				this.trigger.shortcut({
					keys: [
						['5'], // The 5 key on the keyboard
					],
				})
			],
			action: this.ifActive(() => this.addEvidence('book')),
		},
		removeBook: {
			name: 'Remove Evidence: Ghost Writing',
			description: 'Removes Ghost Writing as a piece of evidence for the current ghost',
			triggers: [
				this.trigger.shortcut({
					keys: [
						['SHIFT_L', '5'], // Shift + 5
					],
				})
			],
			action: this.ifActive(() => this.removeEvidence('book')),
		},
		addTemps: {
			name: 'Add Evidence: Freezing Temperatures',
			description: 'Adds Freezing Temperatures as a piece of evidence for the current ghost',
			triggers: [
				this.trigger.shortcut({
					keys: [
						['6'], // The 6 key on the keyboard
					],
				})
			],
			action: this.ifActive(() => this.addEvidence('temps')),
		},
		removeTemps: {
			name: 'Remove Evidence: Freezing Temperatures',
			description: 'Removes Freezing Temperatures as a piece of evidence for the current ghost',
			triggers: [
				this.trigger.shortcut({
					keys: [
						['SHIFT_L', '6'], // Shift + 6
					],
				})
			],
			action: this.ifActive(() => this.removeEvidence('temps')),
		},
		// ---------------------------- //
*/
	}
}

module.exports = new Phasmophobia();
