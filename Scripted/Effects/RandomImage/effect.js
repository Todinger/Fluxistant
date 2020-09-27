'use strict';

const Effect = require('../../effect');

const COMMAND_COST = 300;

class RandomImage extends Effect {
	constructor() {
		super({
			name: 'Random Image',
			tags: ['imgdisp'],
		});
	}
	
	showRandomImage() {
		Effect.Assets.getRandomImageFromCache((name, url) => {
			this.say(`Showing: ${name}`);
			this.broadcastEvent('showImage', {
				image: { url: url },
			});
		});
	}
	
	load() {
		this.registerCommand(
			'pix',
			[],
			user => this.showRandomImage(user),
			COMMAND_COST);
	}
}

module.exports = new RandomImage();
