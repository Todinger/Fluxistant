'use strict';

const path = require('path');
const sound = require("sound-play");
const Module = requireMain('module');

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;

const SUBDIR_NAME = 'Meows';
// TODO: Make channel rewards configurable and remove this
const CHANNEL_REWARD_NAME = 'Catastrophe';
const DURATION = 3 * MINUTES;

let instance = null;

// TODO: Transition to key-based registration and change this to anonymous lambda function
function doKeyPress() {
	instance.keyPressedHandler();
}

// Catastrophe
// -----------
// Activated by a channel point redemption and/or a command.
// For the duration of the effect, every key press plays a random sound from the
// preset SFX subdirectory.
class Catastrophe extends Module {
	constructor() {
		super({
			name: 'Catastrophe',
		});
		
		this.sfxdir = path.join(Module.Assets.getSoundEffectsDir(), SUBDIR_NAME);
		
		this.ongoing = false;
		this.endTime = null;
		this.timer = null;
	}
	
	start() {
		if (this.ongoing) {
			this.endTime += DURATION;
		} else {
			this.say("IT'S A CATASTROPHE! FIND A BOX TO HIDE IN!");
			this.endTime = Date.now() + DURATION;
			this.timer = setTimeout(() => this.timerDone(), DURATION);
			this.startListeningForKeys();
			this.ongoing = true;
		}
	}
	
	timerDone() {
		let now = Date.now();
		if (now < this.endTime) {
			this.timer = setTimeout(() => this.timerDone(), this.endTime - now);
		} else {
			this.end();
		}
	}
	
	end() {
		if (this.ongoing) {
			this.ongoing = false;
			clearTimeout(this.timer);
			this.timer = null;
			this.stopListeningForKeys();
			this.say("Phew, it's over. You can come out now! Meow.");
		}
	}
	
	startListeningForKeys() {
		this.onKeyUp(doKeyPress);
	}
	
	stopListeningForKeys() {
		this.removeKeyUpHandler(doKeyPress);
	}
	
	keyPressedHandler() {
		Module.Assets.getRandomLocalFile(
			this.sfxdir,
			file => sound.play(path.resolve(file), 0.3),
			() => this.error(`No sounds files found in "${this.sfxdir}".`)
		);
	}
	
	load() {
		this.onChannelReward(
			CHANNEL_REWARD_NAME,
			() => this.start()
		);
	}
	
	commands = {
		['catastrophe']: {
			name: 'Start Catastrophe',
			description: 'Starts the cat apocalypse',
			filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
			callback: () => this.start(),
		},
		
		['endcatastrophe']: {
			name: 'End Catastrophe',
			description: 'Ends the cat apocalypse',
			filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
			callback: () => this.end(),
		},
	}
}

instance = new Catastrophe();
module.exports = instance;
