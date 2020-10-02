'use strict';

const Effect = require('../../effect');

class FShower extends Effect {
	constructor() {
		super({
			name: 'F Shower',
			tags: ['imgdrop'], 
		});
	}
	
	sendFile(fileurl) {
		this.broadcastEvent('dropImage', { url: fileurl });
	}
	
	findAndSendFile(user) {
		Effect.Assets.getUserFShowerFile(
			user.name,
			(filename, fileurl) => this.sendFile(fileurl),
			() => {
				Effect.Assets.getRandomFShowerImage(
					(filename, fileurl) => this.sendFile(fileurl),
					() => this.error('No FShower images found in cache'));
			});
	}
	
	load() {
		this.registerCommand(
			'f',
			[],
			user => this.findAndSendFile(user));
	}
}

module.exports = new FShower();
