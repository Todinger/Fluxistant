'use strict';

const Effect = require('../../effect');

class FShower extends Effect {
	constructor() {
		super({
			name: 'F Shower',
			webname: 'fshower',
			source: 'fshower.html',
		});
	}
	
	sendFile(fileurl) {
		this.broadcastEvent('fShower', fileurl);
	}
	
	findAndSendFile(user) {
		Effect.Assets.getUserFShowerFile(
			user.name,
			(filename, fileurl) => this.sendFile(fileurl),
			() => {
				Effect.Assets.getRandomFShowerImage(
					(filename, fileurl) => this.sendFile(fileurl),
					() => console.error('No FShower images found in cache'));
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
