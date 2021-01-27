const assert = require('assert').strict;
const path = require('path');
const Configuration = require('./configuration');

const MAIN_CONFIG = 'fluxbot.config.json';
// const MAIN_CONFIG_DEFAULTS = 'fluxbot.defaults.cfg';
// const MAIN_CONFIG_DESCRIPTOR = 'fluxbot.cfgdesc';
const CONFIG_EXTENSION = '.config.json';
// const DEFAULTS_EXTENSION = '.defaults' + CONFIG_EXTENSION;
// const DESCRIPTOR_EXTENSION = '.cfgdesc';
const MODULES_SUBDIR = 'Modules';

// Manages the configuration objects of all the configurable entities in the
// program.
class ConfigManager {
	constructor() {
		this.configRootDir = null;
		
		// this.mainBasePath = null;
		// this.modulesBasePath = null;
		// this.configsBasePath = null;
		
		// this.mainConfig = null;
		
		this.mainConfig = null;
		this.moduleConfigs = {};
	}
	
	init(configRootDir) {
		this.configRootDir = configRootDir;
		
		// this.mainBasePath = mainBasePath;
		// this.modulesBasePath = modulesBasePath;
		// this.moduleConfigsPath = moduleConfigsPath;
		
		// this.mainConfig = new Configuration(
		// 	this._getMainConfigPath(),
		// 	this._getMainDefaultsPath(),
		// 	this._getMainDescriptorPath()
		// );
		
		// this.moduleConfigs = {};
	}
	
	_getMainConfigPath() {
		return path.join(this.configRootDir, MAIN_CONFIG);
		// return path.join(this.configRootDir, MAIN_CONFIG);
	}
	
	_getModConfigPath(moduleName) {
		return path.join(
			this.configRootDir,
			MODULES_SUBDIR,
			moduleName + CONFIG_EXTENSION);
		// return path.join(
		// 	this.modulesBasePath,
		// 	moduleName,
		// 	moduleName + CONFIG_EXTENSION);
	}
	
	// _getModDefaultsPath(moduleName) {
	// 	return path.join(
	// 		this.modulesBasePath,
	// 		moduleName,
	// 		moduleName + DEFAULTS_EXTENSION);
	// }
	
	// _getModDescriptorPath(moduleName) {
	// 	return path.join(
	// 		this.modulesBasePath,
	// 		moduleName,
	// 		moduleName + DESCRIPTOR_EXTENSION);
	// }
	
	// addModule(moduleName) {
	// 	assert(
	// 		!(moduleName in this.moduleConfigs),
	// 		`Multiple loading of ${moduleName} configuration`);
		
	// 	this.moduleConfigs[moduleName] = new Configuration(
	// 		this._getModConfigPath(moduleName),
	// 		this._getModDefaultsPath(moduleName),
	// 		this._getModDescriptorPath(moduleName)
	// 	);
		
	// 	return this.moduleConfigs[moduleName];
	// }
	
	addModule(moduleName, modConfig) {
		assert(
			!(moduleName in this.moduleConfigs),
			`Multiple loading of ${moduleName} configuration`);
		
		this.moduleConfigs[moduleName] = modConfig;
		
		return this.moduleConfigs[moduleName];
	}
	
	setMain(mainConfig) {
		this.mainConfig = mainConfig;
	}
	
	// addAndLoadModule(moduleName) {
	// 	this.addModule(moduleName).load();
	// }
	
	// onMainConfigChanged(handler) {
	// 	assert(
	// 		typeof handler === 'function',
	// 		`Invalid event handler: ${handler}`);
		
	// 	this.mainConfig.on('configChanged', handler);
	// }
	
	// onModuleConfigChanged(moduleName, handler) {
	// 	assert(
	// 		typeof handler === 'function',
	// 		`Invalid event handler: ${handler}`);
	// 	assert(
	// 		moduleName in this.moduleConfigs,
	// 		`Unknown module config: ${moduleName}`);
		
	// 	this.moduleConfigs[moduleName].on('configChanged', handler);
	// }
	
	loadMain() {
		this.mainConfig.load(this._getMainConfigPath());
	}
	
	loadModule(moduleName) {
		this.moduleConfigs[moduleName].load(this._getModConfigPath(moduleName));
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
}

module.exports = new ConfigManager();
