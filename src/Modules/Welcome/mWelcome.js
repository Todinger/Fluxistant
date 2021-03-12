'use strict';

const assert = require('assert').strict;
const Module = requireMain('module');
const Utils = requireMain('utils');

class WelcomeImage extends Module {
	constructor() {
		super({
			name: 'Welcome',
			tags: ['imgdisp'],
		});
		
		this.lastMessageTimes = {};
		this.welcomeData = {};
	}
	
	processMessage(user) {
		if (user.name in this.welcomeData) {
			let userWelcome = this.welcomeData[user.name];
			if (!(user.name in this.lastMessageTimes)) {
				let imagePromise;
				if (Object.keys(userWelcome.images).length > 0) {
					imagePromise = this.assets.Images.selectFile(user.name);
				} else {
					imagePromise = Promise.resolve();
				}
				
				let soundPromise;
				if (Object.keys(userWelcome.sounds).length > 0) {
					soundPromise = this.assets.Sounds.selectFile(user.name);
				} else {
					soundPromise = Promise.resolve();
				}
				
				Promise.all([imagePromise, soundPromise])
					.then(([image, sound]) => {
						let displayData = {};
						
						if (image) {
							let images = userWelcome.images || {}; // The || {} is to shut the IDE up
							let imageConf = images[image.fileKey];
							displayData.image = imageConf.makeDisplayData(image);
						}
						
						if (sound) {
							let sounds = userWelcome.sounds || {}; // The || {} is to shut the IDE up
							let soundConf = sounds[sound.fileKey];
							displayData.sound = soundConf.makeDisplayData(sound);
						}
						
						if (image || sound) {
							this.broadcastEvent('showImage', displayData);
						}
						
						if (userWelcome.messages && userWelcome.messages.length > 0) {
							this.say(Utils.randomValue(userWelcome.messages));
						}
					})
				
				this.lastMessageTimes[user.name] = Utils.now();
			}
		}
	}
	
	defineModData(modData) {
		modData.addUniformGroupsPool('Images');
		modData.addUniformGroupsPool('Sounds');
	}
	
	defineModConfig(modConfig) {
		modConfig.addDynamicArray('entries', 'Welcome')
			.setName('User Entries')
			.setDescription('A list of all welcome data for users');
	}
	
	loadModConfig(conf) {
		this.welcomeData = {};
		this.assets.Images.clearGroups();
		this.assets.Sounds.clearGroups();
		conf.entries.forEach(entry => {
			if (entry.username && entry.username !== '') {
				let username = entry.username.toLowerCase();
				assert(
					!(username in this.welcomeData),
					`Welcome: Duplicate entry for user "${entry.username}"`);
				
				this.welcomeData[username] = {
					username: username,
					messages: entry.messages,
					images: entry.images.files,
					sounds: entry.sounds.files,
				};
				
				if (Object.keys(entry.images.files).length > 0) {
					this.assets.Images.addGroup(
						username,
						Object.keys(entry.images.files));
				}
				
				if (Object.keys(entry.sounds.files).length > 0) {
					this.assets.Sounds.addGroup(
						username,
						Object.keys(entry.sounds.files));
				}
			}
		});
	}
	
	load() {
		this.onTwitchEvent(
			'message',
			(user, message) => this.processMessage(user, message));
		this.onTwitchEvent(
			'action',
			(user, message) => this.processMessage(user, message));
		this.onTwitchEvent(
			'command',
			(user, message) => this.processMessage(user, message));
	}
}

module.exports = new WelcomeImage();
