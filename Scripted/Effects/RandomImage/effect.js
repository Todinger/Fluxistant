'use strict';

const Effect = require('../../effect');

class RandomImage extends Effect {
	constructor() {
		super({
			name: 'Random Image',
			tags: ['imgdisp'],
		});
	}
	
	showRandomImage() {
		Effect.Assets.getRandomImageFromCache(imageurl => {
			this.broadcastEvent('showImage', {
				image: { url: imageurl },
			});
		});
	}
	
	load() {
		this.registerCommand('pixelate', [], () => this.showRandomImage());
	}
}

module.exports = new RandomImage();
