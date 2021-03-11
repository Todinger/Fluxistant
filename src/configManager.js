const assert = require('assert').strict;
const path = require('path');
const fse = require('fs-extra');
const glob = require('glob');
const EventNotifier = require('./eventNotifier');
const Logger = require('./logger');
const cli = require('./cliManager');
const Utils = require('./utils');

const MAIN_CONFIG = 'fluxbot.config.json';
const CONFIG_EXTENSION = '.config.json';
const MODULES_SUBDIR = 'Modules';
const BACKUPS_SUBDIR = 'Backups';

const BACKUP_NAME_GLOB_PATTERN = 'DDDD.DD.DD-DD.DD.DD/'.split('D').join('[0-9]'); // Search and replace D with [0-9]

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
		Utils.ensureDirExists(this._getBackupsDirPath());
		cli.on(['backup'], () => this.createNewBackup());
	}
	
	_getMainConfigPath() {
		return path.join(this.configRootDir, MAIN_CONFIG);
	}
	
	_getModulesDirPath() {
		return path.join(this.configRootDir, MODULES_SUBDIR);
	}
	
	_getBackupsDirPath() {
		return path.join(this.configRootDir, BACKUPS_SUBDIR);
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
	
	createBackupAt(targetPath) {
		Utils.ensureDirExists(targetPath);
		let mainPromise = fse.copy(this._getMainConfigPath(), path.join(targetPath, MAIN_CONFIG));
		let modulesPromise = fse.copy(this._getModulesDirPath(), path.join(targetPath, MODULES_SUBDIR));
		return Promise.all([mainPromise, modulesPromise])
			.then(() => {
				Logger.info(`Config backup successfully created at: ${targetPath}`);
			})
			.catch(err => {
				Logger.error(`Failed to create config backup at "${targetPath}": ${err}`);
			});
	}
	
	createNewBackup() {
		let targetPath = path.join(
			this._getBackupsDirPath(),
			Utils.formatDate(new Date(), 'YYYY.MM.DD-HH.mm.ss'));
		this.createBackupAt(targetPath)
			.then(() => this.deleteOldBackups())
			.catch(err => Logger.error(`Failed to create a new backup: ${err}`));
	}
	
	deleteBackup(targetPath) {
		fse.remove(targetPath)
			.then(Logger.info(`Config backup "${targetPath}" deleted.`))
			.catch(err => Logger.warn(`Failed to delete backup at "${targetPath}": ${err}`));
	}
	
	deleteOldBackups() {
		glob.glob(
			path.join(
				this._getBackupsDirPath(),
				BACKUP_NAME_GLOB_PATTERN),
			{},
			(err, files) => {
				if (err) {
					Logger.error(`Failed to look for existing backups: ${err}`);
				} else {
					let maxBackups = this.mainConfig.getConfigBackupLimit();
					if (files.length > maxBackups) {
						files.sort();
						let numToDelete = files.length - maxBackups;
						for (let i = 0; i < numToDelete; i++) {
							this.deleteBackup(files[i]);
						}
					}
				}
			});
	}
}

module.exports = new ConfigManager();
