'use strict';

const assert = require('assert').strict;
const imageSize = require('image-size');
const Effect = require('../../effect');

const MINIMUM_SIZE = 300;

class SelfCommands extends Effect {
	constructor() {
		super({
			name: 'Self-Commands',
			tags: ['imgdisp'],
			enabled: false,
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
					url: userFiles.image.url,
					effects: {
						glow: {}
					}
				};
				
				let dimensions = imageSize(userFiles.image.path);
				let largerDimension =
					Math.max(dimensions.width, dimensions.height);
				assert(largerDimension > 0, `Bad image: ${userFiles.image.path}`);
				
				if (largerDimension < MINIMUM_SIZE) {
					let factor = 300 / largerDimension;
					requestData.image.width = dimensions.width * factor;
					requestData.image.height = dimensions.height * factor;
				}
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