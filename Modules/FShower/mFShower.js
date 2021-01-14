'use strict';

const Module = require('../../module');

class FShower extends Module {
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
		Module.Assets.getUserFShowerFile(
			user.name,
			(filename, fileurl) => this.sendFile(fileurl),
			() => {
				Module.Assets.getRandomFShowerImage(
					(filename, fileurl) => this.sendFile(fileurl),
					() => this.error('No FShower images found in cache'));
			});
	}
	
	load() {
		this.registerCommand({
			cmdname: 'f',
			callback: user => this.findAndSendFile(user),
		});
	}
}

module.exports = new FShower();
