'use strict';

const fs = require('fs');
const path = require('path');
const Utils = require('../../utils');
const Effect = require('../../effect');

const COMMANDS_FILENAME = path.join(__dirname, 'commands.json');

// Command structure:
// cmdname: {
// 	filters: [	// Completely optional
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
class Command {
	constructor(cmdname, data) {
		this.cmdname = cmdname;
		this.imageParameters = data.image;
		this.soundurl = data.sound;
		
		if (data.filters) {
			this.filters = data.filters.map(
				filterData => Effect.Filters.fromDataSingle(
					filterData.name,
					filterData.argument));
		}
	}
	
	// Should be in the form of { name: "Filter Name", argument: someValue }
	filterByData(data) {
		return Effect.Filters.fromDataSingle(data.name, data.argument);
	}
}

class ImageCommands extends Effect {
	constructor() {
		super({
			name: 'Image Commands',
			tags: ['imgdisp'],
		});
		
		this.commands = {};
		this.commandsData = {};
	}
	
	_sendCommand(cmd) {
		this.broadcastEvent('showImage', {
			image: cmd.imageParameters,
			sound: cmd.soundurl,
		});
	}
	
	loadCommands() {
		let rawData = fs.readFileSync(COMMANDS_FILENAME);
		let newCommandsData = null;
		
		try {
			newCommandsData = JSON.parse(rawData);
		} catch (err) {
			console.error('Failed to read commands file:');
			console.error(err);
			return;
		}
		
		let changes = Utils.oldNewSplit(this.commandsData, newCommandsData);
		
		Object.keys(changes.remove).forEach(cmdname => {
			this.unregisterCommand(cmdname);
			delete this.commands[cmdname];
		});
		
		Object.keys(changes.add).forEach(cmdname => {
			let cmd = new Command(cmdname, changes.add[cmdname]);
			this.commands[cmdname] = cmd;
			this.registerCommand(
				cmdname,
				cmd.filters,
				() => {
					this._sendCommand(cmd);
				});
		});
		
		this.commandsData = newCommandsData;
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
