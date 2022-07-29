const assert = require('assert').strict;
const safeWriteFile = require('crash-safe-write-file').writeFile;
const Logger = require('./logger');
const ObjectEntity = requireConfig('objectEntity');
const ValueEntity = requireConfig('Values/valueEntity');
const Utils = require('./utils');

// Holds and manages the configuration of a single entity (e.g. a specific
// module, or the main program configuration).
const StaticObjectEntity = requireConfig('staticObjectEntity');
const EntityFactory = require('./Config/entityFactory');

class Configuration {
	constructor(id) {
		this.configRoot = new StaticObjectEntity()
			.setID(id);
	}
	
	addChild(key, type, param) {
		return this.configRoot.addChild(key, EntityFactory.build(type, param));
	}
	
	getChild(key) {
		return this.configRoot.getChild(key);
	}
	
	// Supported fields in the data argument:
	// 	cmdname		Command name. Used to invoke the command in the chat.
	// 	aliases		Array of alias strings, each of which can also invoke it.
	// 	cost		Non-negative integer, the cost of the command in SE points.
	// 	filters		Array of user filters.
	// 
	// Supported user filter data structure:
	// 	type		Identifies the filter (e.g. 'isUser' or 'isMod').
	// 	argument	Filter-specific data (e.g. username for the isUser filter).
	addCommand(data) {
		if (!this.configRoot.hasChild('commands')) {
			this.configRoot.addFixedArray('commands', 'Command')
				.setDescription('Commands associated with this module');
		}
		
		this.getChild('commands').addElement(
			EntityFactory.build('Command', data));
	}
	
	// Uses addCommand() to add all of the commands in the given object while assuming
	// that the keys represent each command's cmdid.
	addCommands(commandsMap) {
		Object.keys(commandsMap).forEach(cmdid => {
			if (!commandsMap[cmdid].cmdid) {
				commandsMap[cmdid].cmdid = cmdid;
			}
			if (!commandsMap[cmdid].cmdname) {
				commandsMap[cmdid].cmdname = cmdid;
			}
			
			this.addCommand(commandsMap[cmdid]);
		});
	}
	
	// Supported fields in the data argument:
	// 	name		Display name.
	// 	description	Display tooltip.
	// 	keys		Array of key sequences (each of which is an array of strings).
	addShortcut(key, data) {
		if (!this.configRoot.hasChild('shortcuts')) {
			this.configRoot.addKeyShortcuts('shortcuts')
				.setName('Keyboard Shortcuts')
				.setDescription('Key-activated functions in this module');
		}
		
		this.getChild('shortcuts').addShortcut(key, data);
	}
	
	// Uses addShortcut() to add all of the shortcuts in the given object
	addShortcuts(shortcutsMap) {
		Object.keys(shortcutsMap).forEach(
			key => this.addShortcut(key, shortcutsMap[key]));
	}
	
	add(key, ...params) {
		params.unshift(key);
		return this.configRoot.add.apply(this.configRoot, params);
	}
	
	addString(key, defaultValue) {
		return this.configRoot.addString(key, defaultValue);
	}
	
	addHiddenString(key, defaultValue) {
		return this.configRoot.addHiddenString(key, defaultValue);
	}
	
	addNumber(key, defaultValue) {
		return this.configRoot.addNumber(key, defaultValue);
	}
	
	addInteger(key, defaultValue) {
		return this.configRoot.addInteger(key, defaultValue);
	}
	
	addPositiveNumber(key, defaultValue) {
		return this.configRoot.addPositiveNumber(key, defaultValue);
	}
	
	addNaturalNumber(key, defaultValue) {
		return this.configRoot.addNaturalNumber(key, defaultValue);
	}
	
	addNonNegativeNumber(key, defaultValue) {
		return this.configRoot.addNonNegativeNumber(key, defaultValue);
	}
	
	addPercentageNumber(key, defaultValue) {
		return this.configRoot.addPercentageNumber(key, defaultValue);
	}
	
	addDegrees(key, defaultValue) {
		return this.configRoot.addDegrees(key, defaultValue);
	}
	
	addDuration(key, defaultValue) {
		return this.configRoot.addDuration(key, defaultValue);
	}
	
	addBoolean(key, defaultValue) {
		return this.configRoot.addBoolean(key, defaultValue);
	}
	
	addColor(key, defaultValue) {
		return this.configRoot.addColor(key, defaultValue);
	}
	
	addFixedArray(key, valueType, values) {
		return this.configRoot.addFixedArray(key, valueType, values);
	}
	
	addDynamicArray(key, valueType, values) {
		return this.configRoot.addDynamicArray(key, valueType, values);
	}
	
	addObject(key) {
		return this.configRoot.addObject(key);
	}
	
	addGroup(key) {
		return this.configRoot.addGroup(key);
	}
	
	addSingleAsset(key, configData) {
		return this.configRoot.addSingleAsset(key, configData);
	}
	
	addMultiAsset(key, configData) {
		return this.configRoot.addMultiAsset(key, configData);
	}
	
	addKeyShortcuts(key) {
		return this.configRoot.addKeyShortcuts(key);
	}
	
	addTextDisplay(key, value) {
		return this.configRoot.addTextDisplay(key, value);
	}
	
	addExpandableTextDisplay(key, value) {
		return this.configRoot.addExpandableTextDisplay(key, value);
	}
	
	addChannelRewardSelection(key, value) {
		return this.configRoot.addChannelRewardSelection(key, value);
	}
	
	addCustomChoice(key, data) {
		return this.configRoot.addCustomChoice(key, data);
	}
	
	toConf() {
		return this.configRoot.toConf();
	}
	
	import(rootDescriptor) {
		if (rootDescriptor) {
			assert(
				rootDescriptor.type === this.configRoot.type,
				`Bad configuration: Expected root object to have the type '${this.configRoot.type}', instead got '${rootDescriptor.type}'.`);
			this.configRoot.import(rootDescriptor, false);
		}
	}
	
	validateConfig(rootDescriptor) {
		assert(
			rootDescriptor.type === this.configRoot.type,
			`Bad configuration: Expected root object to have the type '${this.configRoot.type}', instead got '${rootDescriptor.type}'.`);
		let newConfig = this.configRoot.clone();
		newConfig.import(rootDescriptor);
		newConfig.validate();
	}
	
	export() {
		return this.configRoot.export();
	}
	
	validate() {
		this.configRoot.validate();
	}
	
	// Saves the current configuration from the given config file.
	load(filename) {
		try {
			let rootDescriptor = Utils.tryReadJSON(filename);
			if (rootDescriptor) {
				// Read the configuration from disk and validate it before saving it
				// as the new configuration
				let newConfig = this.configRoot.clone();
				newConfig.import(rootDescriptor, true);
				newConfig.validate();
				this.configRoot = newConfig;
			}
		} catch (err) {
			console.log(`[Configuration] Failed to read JSON file: ${filename}`);
		}
		
		return this.configRoot;
	}
	
	// Saves the current configuration to the given config file.
	save(filename) {
		let descriptor = this.export();
		safeWriteFile(
			filename,
			JSON.stringify(descriptor, null, '\t'),
			err => {
				if (err) throw err;
				Logger.debug(`[Configs] Configuration file saved to: ${filename}`);
			}
		);
	}
	
	// Saves the current configuration to the given config file.
	saveConf(filename) {
		let conf = this.toConf();
		safeWriteFile(
			filename,
			JSON.stringify(conf, null, '\t'),
			err => {
				if (err) throw err;
				Logger.debug(`[Configs] Conf file saved to: ${filename}`);
			}
		);
	}
	
	getGroupValues(groupKey) {
		let values = {};
		
		let group = this.getChild(groupKey);
		assert(
			group instanceof ObjectEntity,
			`Cannot get group values - not a group child key: ${groupKey}`);
		
		group.forEach((key, child) => {
			if (child instanceof ValueEntity) {
				values[key] = child.getValue();
			}
		})
		
		return values;
	}
}

module.exports = Configuration;
