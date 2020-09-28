const fs = require('fs');
const path = require('path');
const User = require('./user');
const Utils = require('./utils');

// Command structure includes a key, which is the command name, optional
// aliases, optional filters and any additional data. This extra data can
// be present in the command itself, no need for an extra nesting level.
// 
// The following example has two extra pieces of data, "image" and "sound":
// 
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
class Command {
	constructor(cmdname, data) {
		this.cmdname = cmdname;
		
		this.aliases = Utils.clone(data.aliases);
		if (this.aliases) {
			if (!(this.cmdname in this.aliases)) {
				this.aliases.push(this.cmdname);
			}
		} else {
			this.aliases = [this.cmdname];
		}
		
		if (data.filters) {
			this.filters = data.filters.map(
				filterData => User.Filters.fromDataSingle(
					filterData.name,
					filterData.argument));
		}
		
		this.readExtraData(data);
	}
	
	readExtraData(data) {
		Object.keys(data).forEach(property => {
			if (!(property in this)) {
				this[property] = Utils.clone(data[property]);
			}
		});
	}
	
	// Should be in the form of { name: "Filter Name", argument: someValue }
	filterByData(data) {
		return User.Filters.fromDataSingle(data.name, data.argument);
	}
}

class CommandManager {
	constructor(effect) {
		this.effect = effect;
		
		this.commands = {};
		this.commandsData = {};
	}
	
	// Loads commands from a given file and registers all of them to invoke
	// the same handler (the handler will be given the Command object of the
	// command that was invoked upon invocation)
	// NOTE: The location of the file is relative to the effect's working
	// directory - i.e. the location of its 'effect.js' file
	loadFile(filename, handler) {
		let rawData = fs.readFileSync(path.join(this.effect.workdir, filename));
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
			this.commands[cmdname].aliases.forEach(alias => {
				this.effect.unregisterCommand(alias);
			});
			
			delete this.commands[cmdname];
		});
		
		Object.keys(changes.add).forEach(cmdname => {
			let cmd = new Command(cmdname, changes.add[cmdname]);
			this.commands[cmdname] = cmd;
			cmd.aliases.forEach(alias => {
				this.effect.registerCommand(
					alias,
					cmd.filters,
					() => handler(cmd)
				);
			});
		});
		
		this.commandsData = newCommandsData;
	}
}

module.exports = CommandManager;
