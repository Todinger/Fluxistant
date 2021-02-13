'use strict';

const Module = requireMain('module');

class FShower extends Module {
	constructor() {
		super({
			name: 'F Shower',
			tags: ['imgdrop'], 
		});
	}
	
	sendFile(fileURL) {
		this.broadcastEvent('dropImage', { url: fileURL });
	}
	
	findAndSendFile(user) {
		Module.Assets.getUserFShowerFile(
			user.name,
			(filename, fileURL) => this.sendFile(fileURL),
			() => {
				Module.Assets.getRandomFShowerImage(
					(filename, fileURL) => this.sendFile(fileURL),
					() => this.error('No FShower images found in cache'));
			});
	}
	
	commands = {
		['f']: {
			name: 'Drop F Image',
			description: 'Drops down user-specific or a randomly selected F image from the top of the screen.',
			callback: user => this.findAndSendFile(user),
		}
	}
}

module.exports = new FShower();
