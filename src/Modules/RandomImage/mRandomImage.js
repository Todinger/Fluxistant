'use strict';

const assert = require('assert').strict;
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
	
	showRandomImage() {
		this.data.Images.selectFile()
			.then(file => {
				assert(
					!this.config.images.files || !(this.fileKey in this.config.images.files),
					'File missing from random image pool.');
				
				let files = this.config.images.files || {};
				let imageConf = files[file.fileKey];
				let displayData = imageConf.makeDisplayData(file);
				// let displayData = ImageFileEntity.makeDisplayData(imageConf, file);
				this.say(`Showing: ${file.name}`);
				this.broadcastEvent('showImage', {
					image: displayData,
				});
			});
	}
	
	defineModData(modData) {
		modData.addUniformPool('Images');
	}
	
	defineModConfig(modConfig) {
		modConfig.add(
			'images',
			'MultiData',
			{
				collection: 'Images',
				dataType: 'IMAGE',
				elementValueType: 'ImageFile',
			})
		.setName('Images')
		.setDescription('The collection of images that can show up');
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
