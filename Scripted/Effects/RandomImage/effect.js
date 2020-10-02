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
	
	describeCommand(user) {
		return `${_.capitalize(COMMAND_NAME)} redeemed by ${user.displayName} for ${COMMAND_COST} ${Effect.USERPOINTS_NAME}! One random drawing by Yecats coming up!`;
	}
	
	load() {
		this.registerCommand({
			cmdname: COMMAND_NAME,
			callback: user => this.showRandomImage(user),
			cost: COMMAND_COST,
			descFunc: user => this.describeCommand(user)
		});
	}
}

module.exports = new RandomImage();
