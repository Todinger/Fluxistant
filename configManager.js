const assert = require('assert').strict;
const path = require('path');
const EventNotifier = require('./eventNotifier');
const Utils = require('./utils');

const MAIN_CONFIG = 'fluxbot.config.json';
const CONFIG_EXTENSION = '.config.json';
const MODULES_SUBDIR = 'Modules';

// Manages the configuration objects of all the configurable entities in the
// program.
class ConfigManager extends EventNotifier {
	constructor() {
		super();
		this._addEvent('modConfigLoaded');
		
		this.configRootDir = null;
		this.mainConfig = null;
		this.moduleConfigs = {};
	}
	
	init(configRootDir) {
		this.configRootDir = configRootDir;
	}
	
	_getMainConfigPath() {
		return path.join(this.configRootDir, MAIN_CONFIG);
	}
	
	_getModBasePath(moduleName) {
		return path.join(
			this.configRootDir,
			MODULES_SUBDIR,
			moduleName);
	}
	
	_getModConfigPath(moduleName) {
		return path.join(
			this._getModBasePath(moduleName),
			moduleName + CONFIG_EXTENSION);
	}
	
	addModule(moduleName, modConfig) {
		assert(
			!(moduleName in this.moduleConfigs),
			`Multiple loading of ${moduleName} configuration`);
		
		Utils.ensureDirExists(this._getModBasePath(moduleName));
		this.moduleConfigs[moduleName] = modConfig;
		return this.moduleConfigs[moduleName];
	}
	
	setMain(mainConfig) {
		this.mainConfig = mainConfig;
		return this.mainConfig;
	}
	
	loadMain() {
		this.mainConfig.load(this._getMainConfigPath());
		return this.mainConfig;
	}
	
	loadModule(moduleName) {
		assert(
			moduleName in this.moduleConfigs,
			`Unknown module: ${moduleName}`);
		
		this.moduleConfigs[moduleName].load(this._getModConfigPath(moduleName));
		let conf = this.moduleConfigs[moduleName].toConf();
		this._notify('modConfigLoaded', moduleName, conf);
		return this.moduleConfigs[moduleName];
	}
	
	loadModules() {
		Object.keys(this.moduleConfigs).forEach(moduleName => {
			this.loadModule(moduleName);
		});
	}
	
	loadAll() {
		this.loadMain();
		this.loadModules();
	}
	
	saveMain() {
		this.mainConfig.save(this._getMainConfigPath());
	}
	
	saveModule(moduleName) {
		this.moduleConfigs[moduleName].save(this._getModConfigPath(moduleName));
	}
	
	saveModules() {
		Object.keys(this.moduleConfigs).forEach(moduleName => {
			this.saveModule(moduleName);
		});
	}
	
	saveAll() {
		this.saveMain();
		this.saveModules();
	}
	
	getMainConfig() {
		return this.mainConfig;
	}
	
	getModuleConfig(moduleName) {
		assert(moduleName in this.moduleConfigs, `Unknown module: ${moduleName}`);
		return this.moduleConfigs[moduleName];
	}
	
	onModConfigLoaded(callback) {
		this.on('modConfigLoaded', callback);
	}
}

module.exports = new ConfigManager();
