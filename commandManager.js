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
		
		// We clone the aliases list since we are about to change it - and if
		// we don't clone it, then next time we load it will look like the
		// data it came from has changed, which would cause us to reload things
		// we shouldn't reload
		this.aliases = Utils.clone(data.aliases);
		
		// Ensure that the main command name is in the list of aliases (that
		// way we can just look at the aliases)
		if (this.aliases) {
			if (!(this.cmdname in this.aliases)) {
				this.aliases.push(this.cmdname);
			}
		} else {
			this.aliases = [this.cmdname];
		}
		
		// If the command has any filters, user their data here to convert
		// them into their respective Filter functions
		if (data.filters) {
			this.filters = data.filters.map(
				filterData => User.Filters.fromDataSingle(
					filterData.name,
					filterData.argument));
		}
		
		// Add any command-specific data we've gotten
		this.readExtraData(data);
	}
	
	// Copies all properties we don't yet have.
	// Basically, this clones the rest of the data into us.
	readExtraData(data) {
		Object.keys(data).forEach(property => {
			if (!(property in this)) {
				this[property] = Utils.clone(data[property]);
			}
		});
	}
	
	// Makes a Filter function from a filter name and an optional argument.
	// The data should be in the form of:
	// 	{
	// 		name: "Filter Name",
	// 		argument: someValue
	// 	}
	filterByData(data) {
		return User.Filters.fromDataSingle(data.name, data.argument);
	}
}

// This class is meant to manage a "commands" file.
// You use it to read all the data in the file, which it then saves in two
// forms: the original data and the parsed, fully-formed Command objects
// represented by that data.
// All of the loaded commands are already registered as actual commands.
// This data is then kept so that the next time the file is loaded, we can
// examine it to see if anything's different and proceed to load and unload
// only the things we need to in order for the new data to be represented
// correctly with minimal changes.
class CommandManager {
	constructor(module) {
		// This class is meant to be used with a concrete Module object (this
		// is to allow for registration under the Module's name as well as
		// to facilitate printouts and such)
		this.module = module;
		
		// This keeps the actual Command objects
		this.commands = {};
		
		// This keeps the original data we read from the file
		this.commandsData = {};
	}
	
	// Loads commands from a given file and registers all of them to invoke
	// the same handler (the handler will be given the Command object of the
	// command that was invoked upon invocation).
	// NOTE: The location of the file is relative to the module's working
	// directory - i.e. the location of its 'module.js' file.
	loadFile(filename, handler) {
		let newCommandsData = null;
		
		// Read the new data
		try {
			newCommandsData = this.module.readJSON(filename);
		} catch (err) {
			this.module.error('Failed to read commands file:');
			this.module.error(err);
			return;
		}
		
		// Compare it with the old data
		let changes = Utils.oldNewSplit(this.commandsData, newCommandsData);
		
		// Anything that needs to be removed is unregistered
		Object.keys(changes.remove).forEach(cmdname => {
			this.commands[cmdname].aliases.forEach(alias => {
				this.module.unregisterCommand(alias);
			});
			
			delete this.commands[cmdname];
		});
		
		// Anything that needs to be added is registered (each alias is
		// registered as a separate command)
		Object.keys(changes.add).forEach(cmdname => {
			let cmd = new Command(cmdname, changes.add[cmdname]);
			this.commands[cmdname] = cmd;
			cmd.aliases.forEach(alias => {
				this.module.registerCommand({
					cmdname: alias,
					filters: cmd.filters,
					callback: () => handler(cmd),
				});
			});
		});
		
		// The new data now accurately represents the commands in the system,
		// so we just save that as-is
		this.commandsData = newCommandsData;
		this.module.log('Loaded commands.');
	}
}

module.exports = CommandManager;
