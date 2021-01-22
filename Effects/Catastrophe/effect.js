'use strict';
const path = require('path');
const sound = require("sound-play");
const Effect = require('../../effect');
const Utils = require('../../utils');

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;

const SUBDIR_NAME = 'Meows';
const START_COMMAND = 'catastrophe';
const END_COMMAND = 'endcatastrophe';
const CHANNEL_REWARD_NAME = 'Catastrophe';
const DURATION = 3 * MINUTES;

var instance = null;

function doKeyPress() {
	instance.keyPressedHandler();
}

// Catastrophe
// -----------
// Activated by a channel point redemption and/or a command.
// For the duration of the effect, every key press plays a random sound from the
// preset SFX subdirectory.
class Catastrophe extends Effect {
	constructor() {
		super({
			name: 'Catastrophe',
		});
		
		this.sfxdir = path.join(Effect.Assets.SoundEffectsDir(), SUBDIR_NAME);
		
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
		let file = Effect.Assets.getRandomLocalFile(
			this.sfxdir,
			file => sound.play(path.resolve(file)),
			() => this.error(`No sounds files found in "${this.sfxdir}".`)
		);
	}
	
	load() {
		this.registerCommand({
			cmdname: START_COMMAND,
			filters: [Effect.Filters.isOneOf(['yecatsmailbox', 'fluxistence'])],
			callback: () => this.start(),
		});
		
		this.registerCommand({
			cmdname: END_COMMAND,
			filters: [Effect.Filters.isOneOf(['yecatsmailbox', 'fluxistence'])],
			callback: () => this.end(),
		});
		
		this.onChannelReward(
			CHANNEL_REWARD_NAME,
			() => this.startGame()
		);
	}
}

instance = new Catastrophe();
module.exports = instance;
