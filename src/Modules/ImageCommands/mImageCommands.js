'use strict';

const Module = requireMain('module');

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
	}
	
	_sendCommand(cmd) {
		this.broadcastEvent('showImage', {
			image: cmd.image,
			sound: cmd.sound,
		});
	}
	
	defineConfig(modConfig) {
		modConfig.addChild('imageCommands', 'DynamicArray', 'ImageCommand')
			.setName('Image Commands')
			.setDescription('Commands for showing images and/or playing sounds');
	}
	
	loadData() {
		this.commandManager.loadFile(
			COMMANDS_FILENAME,
			(cmd) => this._sendCommand(cmd)
		);
	}
}

module.exports = new ImageCommands();
