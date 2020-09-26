'use strict';

const fs = require('fs');
const path = require('path');
const Utils = require('../../utils');
const Effect = require('../../effect');

class SelfCommands extends Effect {
	constructor() {
		super({
			name: 'Self-Commands',
			tags: ['imgdisp'],
		});
	}
	
	invokeCommand(user, command) {
		let username = user.name.toLowerCase();
		if (command.cmdname.toLowerCase() === username) {
			let userFiles = Effect.Assets.getUserFiles(username);
			let requestData = {};
			let hasFiles = false;
			
			if (userFiles.image) {
				hasFiles = true;
				requestData.image = {
					url: userFiles.image,
				};
			}
			
			if (userFiles.sound) {
				hasFiles = true;
				requestData.sound = userFiles.sound;
			}
			
			if (hasFiles) {
				this.broadcastEvent('showImage', requestData);
				return true;
			}
		}
		
		return false;
	}
}

module.exports = new SelfCommands();
