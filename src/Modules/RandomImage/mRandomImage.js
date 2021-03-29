'use strict';

const assert = require('assert').strict;
const path = require('path');
const Module = requireMain('module');

const DESCRIPTION =
`Adds a function for selecting a random image from a defined pool and showing it on the main overlay.

Main overlay address for browser sources: http://localhost:3333/mod/ScriptedModules/ScriptedModules.html

(Note: the port 3333 is the default one, but if you change it in the main settings,
you will need to adjust that address accordingly.`;

class RandomImage extends Module {
	constructor() {
		super({
			name: 'Random Image',
			tags: ['imgdisp'],
			enabledByDefault: false,
			description: DESCRIPTION,
		});
	}
	
	showRandomImage() {
		let fileKey = this.assets.Images.selectFileKey();
		if (!fileKey) {
			this.say("Wait, oh no! The random image pool is empty! SOMEONE SEND HELP I'M NOT DROWNING!");
			return false;
		}
		
		let filename = this.assets.Images.getFilename(fileKey);
		this.assets.Images.getFileWebByKey(fileKey)
			.then(file => {
				assert(
					!this.config.images.files || !(this.fileKey in this.config.images.files),
					'File missing from random image pool.');
				
				let files = this.config.images.files || {};
				let imageConf = files[file.fileKey];
				let displayData = imageConf.makeDisplayData(file);
				this.broadcastEvent('showImage', {
					image: displayData,
				});
			});
		
		return {
			imageName: path.parse(filename).name,
		};
	}
	
	defineModAssets(modData) {
		modData.addUniformPool('Images');
	}
	
	defineModConfig(modConfig) {
		modConfig.addMultiAsset(
			'images',
			{
				collection: 'Images',
				dataType: 'IMAGE',
				elementValueType: 'ImageFile',
			})
		.setName('Images')
		.setDescription('The collection of images that can show up');
	}
	
	functions = {
		showImage: {
			name: 'Show Image',
			description: 'Shows a randomly selected picture from the image pool.',
			action: data => this.showRandomImage(data.user),
			triggers: [
				this.trigger.command({
					cmdname: 'pixelate',
					cost: 300,
				})
			],
			variables: [
				this.variable.out('imageName', {
					name: 'Image Name (`$image`)',
					description: 'The name of the file image that was chosen for display, without its extension',
					example: '"Showing the beautiful `$image`!" ---When showing "Happy Face.png"---> "Showing the beautiful Happy Face!"',
					expr: '$image',
				}),
			],
			responses: [
				this.response.chat('$cmdname redeemed by $user for $pcost! Showing "$image" by Yecats!'),
			],
			// message: `${_.capitalize(COMMAND_NAME)} redeemed by $user for $pcost! One random drawing by Yecats coming up!`,
		},
	}
}

module.exports = new RandomImage();
