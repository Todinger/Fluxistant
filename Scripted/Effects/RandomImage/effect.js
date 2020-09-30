'use strict';

const _ = require('lodash');
const Effect = require('../../effect');

const COMMAND_NAME = 'pixelate';
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
	
	describeCommand() {
		return `${_.capitalize(COMMAND_NAME)} redeemed for ${COMMAND_COST} ${Effect.USERPOINTS_NAME}! One random drawing by Yecats coming up!`;
	}
	
	load() {
		this.registerCommand(
			COMMAND_NAME,
			[],
			user => this.showRandomImage(user),
			COMMAND_COST,
			user => this.describeCommand(user));
	}
}

module.exports = new RandomImage();
