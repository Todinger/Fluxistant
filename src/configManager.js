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
	
	exportMainConfig() {
		return this.getMainConfig().export();
	}
	
	exportModuleConfigs() {
		let moduleConfigs = {};
		Object.keys(this.moduleConfigs).forEach(moduleName => {
			moduleConfigs[moduleName] = this.moduleConfigs[moduleName].export();
		});
		
		return moduleConfigs;
	}
	
	exportAll() {
		return {
			main: this.exportMainConfig(),
			modules: this.exportModuleConfigs(),
		}
	}
	
	importMainConfig(mainConfig) {
		assert(mainConfig, 'Null main configuration received.');
		this.mainConfig.import(mainConfig);
	}
	
	importModuleConfigs(moduleConfigs) {
		assert(moduleConfigs, 'Null modules configuration received.');
		Object.keys(moduleConfigs).forEach(moduleName => {
			this.moduleConfigs[moduleName].import(moduleConfigs[moduleName]);
			this._notify(
				'modConfigLoaded',
				moduleName,
				this.moduleConfigs[moduleName].toConf());
		});
	}
	
	importAll(config) {
		assert(config, 'Null configuration received.');
		this.importMainConfig(config.main);
		this.importModuleConfigs(config.modules);
	}
	
	validateMainConfig(mainConfig) {
		assert(mainConfig, 'Null main configuration received.');
		try {
			this.mainConfig.validateConfig(mainConfig);
		} catch (err) {
			err.path.unshift('Main');
			throw err;
		}
	}
	
	validateModuleConfigs(moduleConfigs) {
		assert(moduleConfigs, 'Null modules configuration received.');
		Object.keys(moduleConfigs).forEach(moduleName => {
			try {
				this.moduleConfigs[moduleName].validateConfig(moduleConfigs[moduleName]);
			} catch (err) {
				err.path.unshift(moduleName);
				err.path.unshift('Modules');
				throw err;
			}
		});
	}
	
	validateAll(config) {
		assert(config, 'Null configuration received.');
		this.validateMainConfig(config.main);
		this.validateModuleConfigs(config.modules);
	}
	
	onModConfigLoaded(callback) {
		this.on('modConfigLoaded', callback);
	}
}

module.exports = new ConfigManager();
