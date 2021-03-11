'use strict';

const assert = require('assert').strict;
// const imageSize = require('image-size');
const Module = requireMain('module');

// const MINIMUM_SIZE = 300;

class SelfCommands extends Module {
	constructor() {
		super({
			name: 'Self-Commands',
			tags: ['imgdisp'],
		});
		
		this.userEntries = {};
	}
	
	invokeCommand(user, command) {
		let username = user.name.toLowerCase();
		if (command.cmdname.toLowerCase() === username && username in this.userEntries) {
			let entry = this.userEntries[username];
			
			let hasImage = entry.image.file.fileKey !== undefined;
			let hasSound = entry.sound.file.fileKey !== undefined;
			
			let imagePromise = hasImage ?
				this.data.getFileWeb(entry.image.file) :
				Promise.resolve();
			
			let soundPromise = hasSound ?
				this.data.getFileWeb(entry.sound.file) :
				Promise.resolve();
			
			let _this = this;
			if (hasImage || hasSound) {
				Promise.all([imagePromise, soundPromise])
					.then(function([imageFile, soundFile]) {
						let parameters = {};
						if (hasImage) {
							parameters.image = entry.image.makeDisplayData(imageFile);
						}
						
						if (hasSound) {
							parameters.sound = entry.sound.makeDisplayData(soundFile);
						}
						
						_this.broadcastEvent('showImage', parameters);
					});
			}
			
			return true;
		}
		
		return false;
	}
	
	defineModData(modData) {
		modData.addNamedCollection('Images');
		modData.addNamedCollection('Sounds');
	}
	
	defineModConfig(modConfig) {
		modConfig.addDynamicArray('entries', 'UserMedia')
			.setName('User Entries')
			.setDescription('Collection of all the users with self-commands and their specifications');
	}
	
	loadModConfig(conf) {
		this.userEntries = {};
		conf.entries.forEach(entry => {
			if (entry.username && entry.username !== '') {
				let username = entry.username.toLowerCase();
				assert(
					!(username in this.userEntries),
					`Self-Commands: Duplicate entry for user "${entry.username}"`);
				
				this.userEntries[username] = {
					username: username,
					image: entry.image,
					sound: entry.sound,
				};
			}
		});
	}
}

module.exports = new SelfCommands();
