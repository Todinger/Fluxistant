'use strict';

const path = require('path');
const sound = require("sound-play");
const Module = requireMain('module');

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;

// TODO: Make channel rewards configurable and remove this
const CHANNEL_REWARD_NAME = 'Catastrophe';
const DURATION = 3 * MINUTES;

let instance = null;

// TODO: Transition to key-based registration and change this to anonymous lambda function
function doKeyPress() {
	instance.playMeow();
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
			// this.startListeningForKeys();
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
			// this.stopListeningForKeys();
			this.say("Phew, it's over. You can come out now! Meow.");
		}
	}
	
	startListeningForKeys() {
		this.onKeyUp(doKeyPress);
	}
	
	stopListeningForKeys() {
		this.removeKeyUpHandler(doKeyPress);
	}
	
	normalizeVolume(volume) {
		if (volume === undefined) {
			volume = 100;
		}
		
		return volume / 100;
	}
	
	calculateFinalVolume(volume) {
		return this.normalizeVolume(this.config.masterVolume) *
			this.normalizeVolume(volume);
	}
	
	playMeow() {
		if (this.ongoing) {
			let soundFile = this.assets.Sounds.selectFileLocal();
			if (soundFile) {
				let files = this.config.sounds.files || {};
				let soundConf = files[soundFile.fileKey];
				
				sound.play(
					path.resolve(soundFile.path),
					this.calculateFinalVolume(soundConf.volume));
			}
		}
	}
	
	defineModData(modData) {
		modData.addUniformPool('Sounds');
	}
	
	defineModConfig(modConfig) {
		modConfig.addNaturalNumber('masterVolume', 100)
			.setName('Master Volume')
			.setDescription('Global volume modifier for all sounds');
		
		modConfig.add(
			'sounds',
			'MultiAsset',
			{
				collection: 'Sounds',
				dataType: 'SOUND',
				elementValueType: 'SoundFile',
			})
			.setName('Sounds')
			.setDescription('The collection of cat sounds that can be played');
	}
	
	load() {
		this.onChannelReward(
			CHANNEL_REWARD_NAME,
			() => this.start()
		);
	}
	
	// commands = {
	// 	['catastrophe']: {
	// 		name: 'Start Catastrophe',
	// 		description: 'Starts the cat apocalypse',
	// 		filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
	// 		callback: () => this.start(),
	// 	},
	//
	// 	['endcatastrophe']: {
	// 		name: 'End Catastrophe',
	// 		description: 'Ends the cat apocalypse',
	// 		filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
	// 		callback: () => this.end(),
	// 	},
	// }
	
	functions = {
		start: {
			name: 'Start Catastrophe',
			description: 'Starts the cat apocalypse',
			filters: [
				this.filter.oneOfUsers(['fluxistence', 'yecatsmailbox']),
			],
			action: () => this.start(),
			triggers: [
				this.trigger.command({
					cmdname: 'catastrophe',
				}),
			],
		},
		
		stop: {
			name: 'End Catastrophe',
			description: 'Ends the cat apocalypse',
			filters: [
				this.filter.oneOfUsers(['fluxistence', 'yecatsmailbox']),
			],
			action: () => this.end(),
			triggers: [
				this.trigger.command({
					cmdname: 'endcatastrophe',
				}),
			],
		},
		
		play: {
			name: 'Meow',
			description: 'Plays a random Meow sound from the pool',
			action: () => this.playMeow(),
			triggers: [
				this.trigger.keyUp(),
			],
		},
	}
}

instance = new Catastrophe();
module.exports = instance;
