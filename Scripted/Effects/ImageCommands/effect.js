'use strict';

const fs = require('fs');
const path = require('path');
const Utils = require('../../utils');
const Effect = require('../../effect');

// Command file structure:
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
// 	},
// 	sound: "/url/of/sound.mp3",		// Optional, can be image only
// 	// Both image and sound are optional, but at least one must be present
// }
const COMMANDS_FILENAME = 'commands.json';

class ImageCommands extends Effect {
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
	
	// loadCommands() {
	// 	let rawData = fs.readFileSync(COMMANDS_FILENAME);
	// 	let newCommandsData = null;
		
	// 	try {
	// 		newCommandsData = JSON.parse(rawData);
	// 	} catch (err) {
	// 		console.error('Failed to read commands file:');
	// 		console.error(err);
	// 		return;
	// 	}
		
	// 	let changes = Utils.oldNewSplit(this.commandsData, newCommandsData);
		
	// 	Object.keys(changes.remove).forEach(cmdname => {
	// 		this.commands[cmdname].aliases.forEach(alias => {
	// 			this.unregisterCommand(alias);
	// 		});
			
	// 		delete this.commands[cmdname];
	// 	});
		
	// 	Object.keys(changes.add).forEach(cmdname => {
	// 		let cmd = new Command(cmdname, changes.add[cmdname]);
	// 		this.commands[cmdname] = cmd;
	// 		cmd.aliases.forEach(alias => {
	// 			this.registerCommand(
	// 				alias,
	// 				cmd.filters,
	// 				() => {
	// 					this._sendCommand(cmd);
	// 				});
	// 		});
	// 	});
		
	// 	this.commandsData = newCommandsData;
	// }
	
	loadCommands() {
		this.commandManager.loadFile(
			COMMANDS_FILENAME,
			(cmd) => this._sendCommand(cmd)
		);
	}
	
	load() {
		this.loadCommands();
		
		// Ctrl + WinKey + F5 = Reread commands
		this.registerShortcutKey(
			'rereadCommands',
			[
				Effect.Keycodes.VC_CONTROL_L,
				Effect.Keycodes.VC_META_L,
				Effect.Keycodes.VC_F5
			],
			() => this.loadCommands()
		);
	}
}

module.exports = new ImageCommands();
