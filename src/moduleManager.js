const fs = require('fs');
const path = require('path');
const assert = require('assert').strict;
const urljoin = require('url-join');
const cli = require('./cliManager');
const KEYCODES = require('./enums').KEYCODES;
const KeyboardManager = require('./keyboardManager');
const ConfigManager = require('./configManager');
const EntityFileManager = require('./entityFileManager');
const DataManager = require('./assetManager');
const Utils = require('./utils');

// Every Module needs to have a file by this name in its root directory
const MODULE_MAIN_FILENAME = "module.js";

// If a module has any custom configuration entities, they should all be in this
// subdirectory and the filenames should all end in 'Entity.js'
const MODULE_CONFIG_DIRNAME = "Config";

// Loads, holds and manages all the various Modules in the system.
class ModuleManager {
	constructor() {
		// Holds all the modules
		this.modules = {};
		
		// Holds web access information for all the modules that have a web
		// presence (basically everything that has a webname and source
		// configured)
		this.clientModules = {};
		
		// Holds all the available tags that clients can attached to, along with
		// which modules have them
		this.tags = {};
		
		// Ctrl + WinKey + F5 = Have all modules (re)load their data
		KeyboardManager.registerShortcut(
			'ModuleManager:ReloadData',
			[
				KEYCODES.VC_CONTROL_L,
				KEYCODES.VC_META_L,
				KEYCODES.VC_F5
			],
			() => this.reloadAllModuleData()
		);
		
		// Register to configuration updates
		ConfigManager.onModConfigLoaded(
			(modName, modConfig) => this._onConfigLoaded(modName, modConfig));
	}
	
	// For validation purposes and to prevent collisions
	nameExists(name) {
		return name in this.modules;
	}
	
	// For validation purposes and to prevent collisions
	webnameExists(webname) {
		return Object.values(this.modules).filter(
			mod => mod.webname === webname).length > 0;
	}
	
	// Reads a single Module, with all that entails.
	// Does not yet call any of the module's startup methods.
	// 
	// Parameters:
	// 	modDir		    Path of the root folder of the module (where module.js is).
	// 	modFile		    Path to the Module's module.js file
	// 				    (basically modDir/module.js).
	// 	webPrefix	    URL to register all modules under. If set to, for example,
	// 				    "/mod/", then all the web URLs will begin with "/mod", so for
	// 				    example a Module with webname = "hello" and
	// 				    source = "world.html" will be accessible at the URL
	// 				    "localhost:3333/mod/hello/world.html" (assuming the server is
	// 				    running locally and listening on port 3333).
	// 	app			    Object used to register web access points URLs).
	// 	express		    User in conjunction with app to register URLs.
	//  generationDir   Specifies that the we should generate files for all the
	//                  module entities, in this specified directory, which can later be
	//                  used in the configuration web page.
	_readModule(modDir, modFile, webPrefix, app, express, generationDir) {
		// This loads the Module from file and invokes its constructor
		let mod = require('./' + modFile);
		
		// Validation: Ensure there are no duplicate registrations
		assert(!this.nameExists(mod.name),
			`Ambiguous module name: '${mod.name}'`);
		
		// Handling of the web part of the loaded Module, if it has one
		if (mod.webname) {
			// Validation: Ensure there are no duplicate registrations
			assert(!this.webnameExists(mod.webname),
				`Web name already taken: '${mod.webname}'`);
			
			// Registers the access point (URL) for the Module directory
			let webdir = urljoin(webPrefix, mod.webname);
			app.use(webdir,
				express.static(path.join(__dirname, modDir)));
			
			// Saves the description of the web properties, to be used later by
			// the ScriptedModules aggregator to display them
			this.clientModules[mod.name] = {
				webname: mod.webname,
				source: urljoin(webdir, mod.source),
				zindex: mod.zindex,
			}
		}
		
		// Registers all the tags declared by the loaded Module (all the tags
		// we have are collected from Modules here)
		if (mod.tags) {
			mod.tags.forEach(tag => {
				if (!(tag in this.tags)) {
					this.tags[tag] = [];
				}
				
				this.tags[tag].push(mod);
			});
		}
		
		// Load custom configuration entities, if there are any
		let configDir = path.join(modDir, MODULE_CONFIG_DIRNAME);
		if (fs.existsSync(configDir)) {
			EntityFileManager.registerEntities(configDir, generationDir);
		}
		
		// Initialize the external values the Module needs before letting it
		// perform its own loading
		mod.moduleManager = this;
		mod.workdir = modDir;
		
		// Save the module and announce it to show initial success
		this.modules[mod.name] = mod;
		cli.log(`[Module Manager] Read module: ${mod.name}`);
	}
	
	// Reads all the Modules, we have in the system, with all that entails.
	// Does not yet call any of the module's startup methods.
	// 
	// This function searches for any subfolder of the given modulesDir that
	// has a file called <MODULE_MAIN_FILENAME> and loads each one it finds.
	// If you want to add a Module called "ABC", add an "ABC" directory under
	// <modulesDir> and put a "module.js" file in it as described in the
	// "module.js" file in the same folder as this file.
	// 
	// Parameters:
	// 	modulesDir	    Path to search in.
	// 	webPrefix	    URL to register all modules under. If set to, for example,
	// 				    "/mod/", then all the web URLs will begin with "/mod", so for
	// 				    example a Module with webname = "hello" and
	// 				    source = "world.html" will be accessible at the URL
	// 				    "localhost:3333/mod/hello/world.html" (assuming the server is
	// 				    running locally and listening on port 3333).
	// 	app			    Object used to register web access points URLs).
	// 	express		    User in conjunction with app to register URLs.
	//  generationDir   Specifies that the we should generate files for all the
	//                  module entities, in this specified directory, which can later be
	//                  used in the configuration web page.
	_readAll(webPrefix, modulesDir, app, express, generationDir) {
		// Load all the modules in the given directory
		let subDirs = Utils.getDirectories(modulesDir);
		subDirs.forEach(subdir => {
			let modDir = path.join(modulesDir, subdir);
			let modFile = path.join(modDir, MODULE_MAIN_FILENAME);
			if (fs.existsSync(modFile)) {
				this._readModule(modDir, modFile, webPrefix, app, express, generationDir);
			}
		});
	}
	
	// Calls all the modules' configuration definition methods, effectively
	// creating their default configurations, ready to be filled with actual
	// values during _loadConfigs().
	_defineConfigAndDataAll() {
		Object.values(this.modules).forEach(mod => this._defineConfigAndData(mod));
	}
	
	// Calls the module's configuration and asset definition methods.
	// This creates its ModuleConfig with all its fields, using default values
	// for everything, and registers the module in DataManager.
	_defineConfigAndData(mod) {
		let modData = DataManager.addModule(mod.name);
		mod.defineData(modData);
		
		if (mod.configurable) {
			mod.defineConfig(mod.modConfig);
			ConfigManager.addModule(mod.name, mod.modConfig);
		}
	}
	
	// Loads all the modules' configurations and assets from disk.
	_loadConfigAndDataAll() {
		DataManager.loadAll();
		ConfigManager.loadModules();
	}
	
	// Loads the module's configuration from disk.
	_onConfigLoaded(modName, modConfig) {
		this.modules[modName].loadConfig(modConfig);
	}
	
	// Loads the module's configuration and runs the module's loading functions.
	// Should be invoked only after all the modules have been read.
	_loadModule(mod) {
		// Let the Module load everything it needs
		// We don't catch errors here because if a Module has a critical
		// problem then we want to know about it immediately and fix it before
		// starting the server
		cli.debug(`[ModuleManager] Loading mod: ${mod.name}`);
		mod.preload();
		mod.loadData(); // NOTE: MODULES SHOULD ONLY SAVE DATA IF IT IS VALID 
		mod.load();
	}
	
	// Loads all pre-read modules and runs their initialization functions
	// (everything except module.postload()).
	_loadAll() {
		Object.values(this.modules).forEach(mod => this._loadModule(mod));
	}
	
	// Reads and loads all the Modules we have in the system, with all that
	// entails.
	// When this method finishes, all the modules are fully configured and have
	// finished starting up.
	// 
	// Parameters:
	// 	modulesDir	    Path to search the modules in.
	// 	webPrefix	    URL to register all modules under. If set to, for example,
	// 				    "/mod/", then all the web URLs will begin with "/mod", so for
	// 				    example a Module with webname = "hello" and
	// 				    source = "world.html" will be accessible at the URL
	// 				    "localhost:3333/mod/hello/world.html" (assuming the server is
	// 				    running locally and listening on port 3333).
	// 	app			    Object used to register web access points URLs).
	// 	express		    User in conjunction with app to register URLs.
	//  generationDir   Specifies that the we should generate files for all the
	//                  module entities, in this specified directory, which can later be
	//                  used in the configuration web page.
	readAndLoadAll(webPrefix, modulesDir, app, express, generationDir) {
		this._readAll(webPrefix, modulesDir, app, express, generationDir);
		if (generationDir) return;
		
		this._defineConfigAndDataAll();
		this._loadConfigAndDataAll();
		this._loadAll();
		this._postloadAll();
	}
	
	// Runs over all the previously loaded Modules and invoke their postload()
	// function, which is meant to be called only after all the Modules have
	// loaded.
	_postloadAll() {
		Object.values(this.modules).forEach(mod => {
			mod.postload();
		});
	}
	
	// Attaches the given client (<socket>) to the Module called <moduleName>.
	attachClient(moduleName, socket) {
		if (this.nameExists(moduleName)) {
			this.modules[moduleName].attachClient(socket, 'direct');
		} else {
			cli.warn(`[Module Manager] Unknown module: ${moduleName}`);
		}
	}
	
	// Attaches the given client to all the Modules tagged by the given tag.
	attachClientToTag(tag, socket) {
		if (tag in this.tags) {
			this.tags[tag].forEach(mod => mod.attachClient(socket, 'tag'));
		} else {
			cli.warn(`[Module Manager] Unknown tag: ${tag}`);
		}
	}
	
	// Invokes the .loadData() function of all the loaded Modules.
	// This is meant to refresh external data that is read by the Modules during
	// runtime.
	reloadAllModuleData() {
		Object.values(this.modules).forEach(mod => {
			// We do catch errors here because all the loaded Modules are
			// currently already running with valid data from the last time they
			// had .loadData() called, so if the data files have changed in a
			// way that causes an error, we can simply show that error and not
			// load them and the program will be able to continue running fine
			// with the old data
			try {
				// For the above reason, .loadData() should only save loaded
				// data if the data is valid
				mod.loadData();
			} catch (err) {
				cli.log(`[Module Manager] Error loading data in ${mod.name}: ${err}`);
			}
		});
	}
}

module.exports = new ModuleManager();
