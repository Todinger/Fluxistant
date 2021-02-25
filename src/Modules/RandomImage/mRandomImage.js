'use strict';

const _ = require('lodash');
const Module = requireMain('module');

const COMMAND_NAME = 'pixelate';

class RandomImage extends Module {
	constructor() {
		super({
			name: 'Random Image',
			tags: ['imgdisp'],
		});
	}
	
	// defineModData(modData) {
	// 	// TODO: User a uniform pool here, not a single data file
	// 	// modData.addUniformPool('images');
	// 	modData.addSingleFile('images');
	// }
	//
	// defineModConfig(modConfig) {
	// 	// TODO: Add configuration for the image pool
	// 	modConfig.addData('imagePool', {
	// 		colID: 'images',
	// 		dataType: 'IMAGE',
	// 	})  .setName('Images')
	// 		.setDescription('The pool of images from which a random one will be chosen for display.');
	// }
	
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
			name: 'Show Image',
			description: 'Shows a randomly selected picture from the image pool.',
			callback: user => this.showRandomImage(user),
			message: `${_.capitalize(COMMAND_NAME)} redeemed by $user for $pcost! One random drawing by Yecats coming up!`,
			cost: 300,
		},
	}
}

module.exports = new RandomImage();
