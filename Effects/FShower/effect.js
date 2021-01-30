'use strict';

const Effect = require('../../effect');
const SIZE_REGEX = /.*\[(\s*[0-9]+\s*)?x(\s*[0-9]+\s*)?].*/

class FShower extends Effect {
	constructor() {
		super({
			name: 'F Shower',
			tags: ['imgdrop'], 
		});
	}
	
	sendFile(filename, fileurl) {
		this.log(`Filename: ${filename}`);
		let match = filename.match(SIZE_REGEX);
		let image = { url: fileurl };
		if (match) {
			if (image.width) image.width = Number(match[1]);
			if (image.height) image.height = Number(match[2]);
		}
		
		image.count = 15;
		
		this.log(`Dropping image ${image.url} with size ${image.width}x${image.height}`)
		this.broadcastEvent('dropImage', image);
	}
	
	findAndSendFile(user) {
		Effect.Assets.getUserFShowerFile(
			user.name,
			(filename, fileurl) => this.sendFile(filename, fileurl),
			() => {
				Effect.Assets.getRandomFShowerImage(
					(filename, fileurl) => this.sendFile(filename, fileurl),
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
