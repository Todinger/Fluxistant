'use strict';

const Module = requireMain('module');
// const Utils = requireMain('utils');

// Command file structure:
//	{
//		cmdname1: {...},
//		cmdname2: {...},
//	}
// 
// Command details:
// cmdname: {
// 	aliases: [ "list", "of", "aliases" ],	// Completely optional
// 	filters: [								// Completely optional
// 		{
// 			name: "filterName",		// E.g. "isUser"
// 			argument: "Some value",	// E.g. "Fluxistence", omit if unnecessary
// 		},
// 		// More filters if so desired
// 	],
// 	image: {						// Optional, can be sound only
// 		url: "/url/of/image.png",
// 		width: widthInPixels,		// Optional, defaults to 300
// 		height: heightInPixels,		// Optional, defaults to 300
// 		duration: timeInMS,			// Optional, defaults to 300
// 	},
// 	sound: "/url/of/sound.mp3",		// Optional, can be image only
// 	// Both image and sound are optional, but at least one must be present
// }
const COMMANDS_FILENAME = 'commands.json';

class ImageCommands extends Module {
	constructor() {
		super({
			name: 'Image Commands',
			tags: ['imgdisp'],
		});
		
		this.imageCommands = {};
	}
	
	// _sendCommand(cmd) {
	// 	this.broadcastEvent('showImage', {
	// 		image: cmd.image,
	// 		sound: cmd.sound,
	// 	});
	// }
	
	// defineConfig(modConfig) {
	// 	modConfig.addChild('imageCommands', 'DynamicArray', 'ImageCommand')
	// 		.setName('Image Commands')
	// 		.setDescription('Commands for showing images and/or playing sounds');
	// }
	
	_sendCommand(cmdObject) {
		let _this = this;
		let promises = [];
		
		let hasImage = this.data.Images.hasKey(cmdObject.image.file.key);
		let hasSound = this.data.Sounds.hasKey(cmdObject.sound.file.key);

		let imagePromise = hasImage ?
			promises.push(this.data.getFileWeb(cmdObject.image)) :
			Promise.resolve();

		let soundPromise = hasImage ?
			promises.push(this.data.getFileWeb(cmdObject.sound)) :
			Promise.resolve();

		if (hasImage || hasSound) {
			Promise.all([imagePromise, soundPromise])
			.then(function([imageDataURL, soundDataURL]) {
				let parameters = {};
				if (hasImage) {
					parameters.image = Utils.objectWith(cmdObject.image, { url: imageDataURL });
				}

				if (hasSound) {
					parameters.image = Utils.objectWith(cmdObject.sound, { url: soundDataURL });
				}

				_this.broadcastEvent('showImage', parameters);
			});
		}
	}

	defineModData(modData) {
		modData.addNamedCollection('Images');
		modData.addNamedCollection('Sounds');
	}

	defineModConfig(modConfig) {
		modConfig.add(
			'imageCommands',
			'DynamicArray',
			'ImageCommand')
		.setName('Image Commands')
		.setDescription('Commands for showing images and/or playing sounds');
	}

	loadModConfig(conf) {
		this.unregisterCommands(this.imageCommands);
		this.imageCommands = this.createCommandObjects(conf.imageCommands);
		conf.imageCommands.forEach(command => {
			let cmdObject = this.createCommandObject(command);
			cmdObject.callback = (co) => this._sendCommand(co);
			cmdObject.image = command.image;
			cmdObject.sound = command.sound;
		});

		this.registerCommands(this.imageCommands);
	}
	
	loadData() {
		this.commandManager.loadFile(
			COMMANDS_FILENAME,
			(cmd) => this._sendCommand(cmd)
		);
	}
}

module.exports = new ImageCommands();
