'use strict';

const _ = require('lodash');
const Effect = require('../../effect');
const Utils = require('../../utils');

const WELCOME_DATA_FILENAME = 'welcomes.json';

class WelcomeImage extends Effect {
	constructor() {
		super({
			name: 'Welcome Image',
			tags: ['imgdisp'],
		});
		
		this.lastMessageTimes = {};
		this.welcomeData = {};
	}
	
	processMessage(user, message) {
		if (user.name in this.welcomeData) {
			let userWelcome = this.welcomeData[user.name];
			if (!(user.name in this.lastMessageTimes)) {
				let image = undefined;
				if (userWelcome.images) {
					image = Utils.randomValue(userWelcome.images);
				}
				
				let sound = userWelcome.sound;
				
				if (image || sound) {
					this.broadcastEvent('showImage', {
						image: image,
						sound: sound,
					});
				}
				
				if (userWelcome.messages && userWelcome.messages.length > 0) {
					this.say(Utils.randomValue(userWelcome.messages));
				}
				
				// Consider putting this outside this if statement if we want to
				// add a mechanism later for showing welcome messages after a
				// period of inactivity
				this.lastMessageTimes[user.name] = Utils.now();
			}
		}
	}
	
	loadData() {
		try {
			this.welcomeData = this.readJSON(WELCOME_DATA_FILENAME);
			this.log('Loaded welcome data.');
		} catch (err) {
			this.error('Failed to read welcome data:');
			this.error(err);
		}
	}
	
	load() {
		this.onTwitchEvent(
			'message',
			(user, message) => this.processMessage(user, message));
	}
}

module.exports = new WelcomeImage();
