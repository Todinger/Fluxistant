const assert = require('assert').strict;
const path = require('path');
const Configuration = require('./configuration');

const MAIN_CONFIG = 'fluxbot.cfg';
const MAIN_CONFIG_DEFAULTS = 'fluxbot.defaults.cfg';
const MAIN_CONFIG_DESCRIPTOR = 'fluxbot.cfgdesc';
const CONFIG_EXTENSION = '.cfg';
const DEFAULTS_EXTENSION = '.defaults' + CONFIG_EXTENSION;
const DESCRIPTOR_EXTENSION = '.cfgdesc';

// Manages the configuration objects of all the configurable entities in the
// program.
class ConfigManager {
	constructor() {
		this.mainBasePath = null;
		this.modulesBasePath = null;
		this.configsBasePath = null;
		
		this.mainConfig = null;
		
		this.moduleConfigs = {};
	}
	
	init(mainBasePath, mainConfigPath, modulesBasePath, moduleConfigsPath) {
		this.mainBasePath = mainBasePath;
		this.modulesBasePath = modulesBasePath;
		this.mainConfigPath = mainConfigPath;
		this.moduleConfigsPath = moduleConfigsPath;
		
		this.mainConfig = new Configuration(
			this._getMainConfigPath(),
			this._getMainDefaultsPath(),
			this._getMainDescriptorPath()
		);
		
		this.moduleConfigs = {};
	}
	
	_getMainConfigPath() {
		return path.join(this.mainConfigPath, MAIN_CONFIG);
	}
	
	_getMainDefaultsPath() {
		return path.join(this.mainBasePath, MAIN_CONFIG_DEFAULTS);
	}
	
	_getMainDescriptorPath() {
		return path.join(this.mainBasePath, MAIN_CONFIG_DESCRIPTOR);
	}
	
	_getModConfigPath(moduleName) {
		return path.join(
			this.moduleConfigsPath,
			moduleName,
			moduleName + CONFIG_EXTENSION);
	}
	
	_getModDefaultsPath(moduleName) {
		return path.join(
			this.modulesBasePath,
			moduleName,
			moduleName + DEFAULTS_EXTENSION);
	}
	
	_getModDescriptorPath(moduleName) {
		return path.join(
			this.modulesBasePath,
			moduleName,
			moduleName + DESCRIPTOR_EXTENSION);
	}
	
	addModule(moduleName) {
		assert(
			!(moduleName in this.moduleConfigs),
			`Multiple loading of ${moduleName} configuration`);
		
		this.moduleConfigs[moduleName] = new Configuration(
			this._getModConfigPath(moduleName),
			this._getModDefaultsPath(moduleName),
			this._getModDescriptorPath(moduleName)
		);
	}
	
	onMainConfigChanged(handler) {
		assert(
			typeof handler === 'function',
			`Invalid event handler: ${handler}`);
		
		this.mainConfig.on('configChanged', handler);
	}
	
	onModuleConfigChanged(moduleName, handler) {
		assert(
			typeof handler === 'function',
			`Invalid event handler: ${handler}`);
		assert(
			moduleName in this.moduleConfigs,
			`Unknown module config: ${moduleName}`);
		
		this.moduleConfigs[moduleName].on('configChanged', handler);
	}
	
	loadMain() {
		this.mainConfig.load();
	}
	
	loadModules() {
		Object.values(this.moduleConfigs).forEach(moduleConfig => {
			moduleConfig.load();
		});
	}
	
	loadAll() {
		this.loadMain();
		this.loadModules();
	}
	
	saveAll() {
		this.mainConfig.save();
		
		Object.values(this.moduleConfigs).forEach(moduleConfig => {
			moduleConfig.save();
		});
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
