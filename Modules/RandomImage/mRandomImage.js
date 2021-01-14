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
	
	describeCommand(user) {
		return `${_.capitalize(COMMAND_NAME)} redeemed by ${user.displayName} for ${this.pointsString(COMMAND_COST)}! One random drawing by Yecats coming up!`;
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
