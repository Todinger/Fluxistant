const fs = require('fs');
const assert = require('assert').strict;
const Logger = require('./logger');
const ObjectEntity = requireConfig('objectEntity');
const ValueEntity = requireConfig('valueEntity');
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
			this.configRoot.add('commands', 'FixedArray', 'Command')
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
	
	// Uses addCommand() to add all of the commands in the given object while assuming
	// that the keys represent each command's cmdid.
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
	
	addBoolean(key, defaultValue) {
		return this.configRoot.addBoolean(key, defaultValue);
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
	
	addSingleData(key, configData) {
		return this.configRoot.addSingleData(key, configData);
	}
	
	addMultiData(key, configData) {
		return this.configRoot.addMultiData(key, configData);
	}
	
	addKeyShortcuts(key) {
		return this.configRoot.addKeyShortcuts(key);
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
		// TODO: Uncomment try-catch blocks
		// try {
			let rootDescriptor = Utils.tryReadJSON(filename);
			if (rootDescriptor) {
				// assert(
				// 	rootDescriptor.type === this.configRoot.type,
				// 	`Bad configuration: Expected root object to have the type '${this.configRoot.type}', instead got '${rootDescriptor.type}'.`);
				
				// Read the configuration from disk and validate it before saving it
				// as the new configuration
				let newConfig = this.configRoot.clone();
				newConfig.import(rootDescriptor, true);
				newConfig.validate();
				this.configRoot = newConfig;
			}
		// } catch (err) {
			// console.log(`[Configuration] Failed to read JSON file: ${filename}`);
		// }
		
		return this.configRoot;
	}
	
	// Saves the current configuration to the given config file.
	save(filename) {
		let descriptor = this.export();
		fs.writeFile(
			filename,
			JSON.stringify(descriptor, null, '\t'),
			err => {
				if (err) throw err;
				Logger.info(`Configuration file saved to: ${filename}`);
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


/*
class Configuration {
	constructor(configPath, defaultsPath, descriptorPath) {
		super();
		this.configPath = configPath;
		this.defaultsPath = defaultsPath;
		this.descriptorPath = descriptorPath;
		
		this.currConfig = {};
		this.descriptor = {};
		
		this._addEvent('configChanged');
	}
	
	// Gets the value of the value in the configuration with the given name
	// (note: returns a copy, so it's safe to edit it)
	get(name) {
		assert(name in this.currConfig, `Unknown configuration value: ${name}`);
		return Utils.clone(this.currConfig[name]);
	}
	
	// Sets the value of the property in the configuration with the given name
	// to the given value
	get(name, value) {
		this.currConfig[name] = value;
	}
	
	readJSON(path) {
		let rawData = null;
		
		// If there's an error reading from file
		try {
			rawData = fs.readFileSync(path);
		} catch (err) {
			return null;
		}
		
		return JSON.parse(rawData);
	}
	
	validate(cfg, desc) {
		// Verify that the read configuration adheres to the descriptor
		Object.keys(cfg).forEach(propertyName => {
			assert(
				propertyName in desc,
				`${this.configPath}: Property '${propertyName}' not in the configuration descriptor.`);
		});
		
		// Verify that all the mandatory properties in the descriptor are
		// accounted for
		Object.keys(desc).forEach(propertyName => {
			if (!desc[propertyName].optional) {
				assert(
					propertyName in cfg,
					`${this.configPath}: Mandatory property ${propertyName} missing from config.`)
			}
		});
	}
	
	// Reads the current configuration from file, updates the saved config if
	// there are any changes, and also notifies about the changes if there are
	// any
	load() {
		// If we have no configuration description then this Configuration
		// object is empty and should just not have anything
		if (fs.existsSync(this.descriptorPath)) {
			// Read the configuration descriptor - it describes the fields in
			// the configuration (configuration and defaults need to adhere to
			// it)
			let desc = JSON.parse(descriptorPath);
			
			// Read the config and defaults from disk and apply the defaults
			let cfg = {};
			if (fs.existsSync(this.configPath)) {
				cfg = JSON.parse(fs.readFileSync(this.configPath));
			}
			
			let def = {};
			if (fs.existsSync(this.defaultsPath)) {
				def = JSON.parse(fs.readFileSync(this.defaultsPath));
			}
			Utils.applyDefaults(cfg, def);
			
			// Validate the configuration fits the descriptor and save the
			// descriptor if so
			this.validate(cfg, desc);
			this.descriptor = desc;
			
			// Compare the result from the above with the current configuration
			let changes = Utils.oldNewSplit(this.currConfig, cfg);
			if (changes.add != null || changes.remove != null) {
				this._notify('configChanged', Utils.clone(changes));
				this.currConfig = cfg;
			}
		}
		
		return this;
	}
	
	// Saves the current configuration to the config file
	save() {
		fs.writeFile(this.configPath, JSON.stringify(this.cfg, null, '\t'));
	}
}
*/

module.exports = Configuration;
