'use strict';

const path = require('path');
const sound = require("sound-play");
const Module = requireMain('module');

const SECONDS = 1;
const MINUTES = 60 * SECONDS;
const USER_SECONDS = 1000;

const DEFAULT_DURATION = 3 * MINUTES;

const DESCRIPTION =
`Activated by a channel point redemption and/or a command.

For the duration of the effect, every key press plays a random sound from the
preset sound pool and floats up a random image from the image pool on the main overlay.

Main overlay address for browser sources: http://localhost:3333/mod/ScriptedModules/ScriptedModules.html

(Note: the port 3333 is the default one, but if you change it in the main settings,
you will need to adjust that address accordingly.`;

// Catastrophe
// -----------
// Activated by a channel point redemption and/or a command.
// For the duration of the effect, every key press plays a random sound from the
// preset SFX subdirectory.
class Catastrophe extends Module {
	constructor() {
		super({
			name: 'Catastrophe',
			tags: ['imgdrop'],
			description: DESCRIPTION,
		});
		
		this.ongoing = false;
		this.endTime = null;
		this.timer = null;
	}
	
	start() {
		let duration = this.config.duration !== undefined ? this.config.duration : DEFAULT_DURATION;
		duration *= USER_SECONDS;
		if (this.ongoing) {
			this.endTime += duration;
		} else {
			this.say("IT'S A CATASTROPHE! FIND A BOX TO HIDE IN!");
			this.endTime = Date.now() + duration;
			this.timer = setTimeout(() => this.timerDone(), duration);
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
			this.say("Phew, it's over. You can come out now! Meow.");
		}
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
	
	meow() {
		if (this.ongoing) {
			let soundFile = this.assets.Sounds.selectFileLocal();
			if (soundFile) {
				let files = this.config.sounds.files || {};
				let soundConf = files[soundFile.fileKey];
				
				sound.play(
					path.resolve(soundFile.path),
					this.calculateFinalVolume(soundConf.volume));
			}
			
			this.assets.Images.selectFile()
				.then(imageFile => {
					if (imageFile) {
						let files = this.config.images.files || {};
						let imageConf = files[imageFile.fileKey];
						let displayData = imageConf.makeDisplayData(imageFile);
						displayData.count = 1;
						this.broadcastEvent('floatImage', displayData);
					}
				});
		}
	}
	
	defineModData(modData) {
		modData.addUniformPool('Sounds');
		modData.addUniformPool('Images');
	}
	
	defineModConfig(modConfig) {
		modConfig.addNonNegativeNumber('duration', DEFAULT_DURATION)
			.setName('Duration')
			.setDescription('Time in seconds that the Catastrophe lasts (subsequent activations increase by this much as well)');
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
		
		modConfig.add(
			'images',
			'MultiAsset',
			{
				collection: 'Images',
				dataType: 'IMAGE',
				elementValueType: 'ImageFile',
			})
			.setName('Images')
			.setDescription('The collection of cat images that can be float up when a meow is played');
	}
	
	load() {
		// this.onChannelReward(
		// 	CHANNEL_REWARD_NAME,
		// 	() => this.start()
		// );
	}
	
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
			action: () => this.meow(),
			triggers: [
				this.trigger.keyUp(),
				this.trigger.keyDown({
					cooldowns: {
						global: 1,
					}
				}),
			],
		},
	}
}

module.exports = new Catastrophe();
