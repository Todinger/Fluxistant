'use strict';

const _ = require('lodash');
const Module = require('../../module');

const COMMAND_NAME = 'pixelate';
const COMMAND_COST = 300;

class RandomImage extends Module {
	constructor() {
		super({
			name: 'Random Image',
			tags: ['imgdisp'],
		});
	}
	
	showRandomImage() {
		Module.Assets.getRandomImageFromCache((name, url) => {
			this.say(`Showing: ${name}`);
			this.broadcastEvent('showImage', {
				image: { url: url },
			});
		});
	}
	
	commands = {
		[COMMAND_NAME]: {
			callback: user => this.showRandomImage(user),
			message: `${_.capitalize(COMMAND_NAME)} redeemed by $user for $pcost! One random drawing by Yecats coming up!`,
			cost: COMMAND_COST,
		},
	}
}

module.exports = new RandomImage();
