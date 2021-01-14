const fs = require('fs');
const path = require('path');
const assert = require('assert').strict;
const urljoin = require('url-join');
const cli = require('./cliManager');
const KEYCODES = require('./enums').KEYCODES;
const KeyboardManager = require('./keyboardManager');
const Utils = require('./utils');

// Every Module needs to have a file by this name in its root directory
const MODULE_MAIN_FILENAME = "module.js";

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
	}
	
	// For validation purposes and to prevent collisions
	nameExists(name) {
		return name in this.modules;
	}
	
	// For validation purposes and to prevent collisions
	webnameExists(webname) {
		return Object.values(this.modules).filter(
			module => module.webname == webname).length > 0;
	}
	
	// Loads a single Module, with all that entails.
	// 
	// Parameters:
	// 	moddir		Path of the root folder of the module (where module.js is).
	// 	modfile		Path to the Module's module.js file
	// 				(basically moddir/module.js).
	// 	webPrefix	URL to register all modules under. If set to, for example,
	// 				"/mod/", then all the web URLs will begin with "/mod", so for
	// 				example a Module with webname = "hellow" and
	// 				source = "world.html" will be accessible at the URL
	// 				"localhost:3333/mod/hello/world.html" (assuming the server is
	// 				running locally and listening on port 3333).
	// 	app			Object used to register web access points URLs).
	// 	express		User in conjunction with app to register URLs.
	_loadModule(moddir, modfile, webPrefix, app, express) {
		// This loads the Module from file and invokes its constructor
		let module = require('./' + modfile);
		
		// If the module is disabled we ignore it completely
		if (!module.enabled) {
			return;
		}
		
		// Validation: Ensure there are no duplicate registrations
		assert(!this.nameExists(module.name),
			`Ambiguous module name: '${module.name}'`);
		
		// Handling of the web part of the loaded Module, if it has one
		if (module.webname) {
			// Validation: Ensure there are no duplicate registrations
			assert(!this.webnameExists(module.webname),
				`Web name already taken: '${module.webname}'`);
			
			// Registers the access point (URL) for the Module directory
			let webdir = urljoin(webPrefix, module.webname);
			app.use(webdir,
				express.static(path.join(__dirname, moddir)));
			
			// Saves the description of the web properties, to be used later by
			// the ScriptedModules aggragator to display them
			this.clientModules[module.name] = {
				webname: module.webname,
				source: urljoin(webdir, module.source),
				zindex: module.zindex,
			}
		}
		
		// Registers all the tags declared by the loaded Module (all the tags
		// we have are collected from Modules here)
		if (module.tags) {
			module.tags.forEach(tag => {
				if (!(tag in this.tags)) {
					this.tags[tag] = [];
				}
				
				this.tags[tag].push(module);
			});
		}
		
		// Initialize the external values the Module needs before letting it
		// perform its own loading
		module.moduleManager = this;
		module.workdir = moddir;
		
		// Let the Module load everything it needs
		// We don't catch errors here because if a Module has a critical
		// problem then we want to know about it immediately and fix it before
		// starting the server
		module.preload();
		module.loadData(); // NOTE: MODULES SHOULD ONLY SAVE DATA IF IT IS VALID 
		module.load();
		
		// Save the module and announce it to show success
		this.modules[module.name] = module;
		cli.log(`Loaded module: ${module.name}`);
	}
	
	// Loads all the Modules, we have in the system, with all that entails.
	// This function searches for any subfolder of the given modulesdir that
	// has a file called <MODULE_MAIN_FILENAME> and loads each one it finds.
	// If you want to add a Module called "ABC", add an "ABC" directory under
	// <modulesdir> and put a "module.js" file in it as described in the
	// "module.js" file in the same folder as this file.
	// 
	// Parameters:
	// 	modulesdir	Path to search in.
	// 	webPrefix	URL to register all modules under. If set to, for example,
	// 				"/mod/", then all the web URLs will begin with "/mod", so for
	// 				example a Module with webname = "hellow" and
	// 				source = "world.html" will be accessible at the URL
	// 				"localhost:3333/mod/hello/world.html" (assuming the server is
	// 				running locally and listening on port 3333).
	// 	app			Object used to register web access points URLs).
	// 	express		User in conjunction with app to register URLs.
	loadAll(webPrefix, modulesdir, app, express) {
		// Load all the modules in the given directory
		let subdirs = Utils.getDirectories(modulesdir);
		subdirs.forEach(subdir => {
			let moddir = path.join(modulesdir, subdir);
			let modfile = path.join(moddir, MODULE_MAIN_FILENAME);
			if (fs.existsSync(modfile)) {
				this._loadModule(moddir, modfile, webPrefix, app, express);
			}
		});
		
		this.postloadAll();
	}
	
	// Runs over all the previously loaded Modules and invoke their postload()
	// function, which is meant to be called only after all the Modules have
	// loaded.
	postloadAll() {
		Object.values(this.modules).forEach(module => {
			module.postload();
		});
	}
	
	// Attaches the given client (<socket>) to the Module called <moduleName>.
	attachClient(moduleName, socket) {
		if (this.nameExists(moduleName)) {
			this.modules[moduleName].attachClient(socket, 'direct');
		} else {
			cli.warn(`Unknown module: ${moduleName}`);
		}
	}
	
	// Attaches the given client to all the Modules tagged by the given tag.
	attachClientToTag(tag, socket) {
		if (tag in this.tags) {
			this.tags[tag].forEach(module => module.attachClient(socket, 'tag'));
		} else {
			cli.warn(`Unknown tag: ${tag}`);
		}
	}
	
	// Invokes the .loadData() function of all the loaded Modules.
	// This is meant to refresh external data that is read by the Modules during
	// runtime.
	reloadAllModuleData() {
		Object.values(this.modules).forEach(module => {
			// We do catch errors here because all the loaded Modules are
			// currently already running with valid data from the last time they
			// had .loadData() called, so if the data files have changed in a
			// way that causes an error, we can simply show that error and not
			// load them and the program will be able to continue running fine
			// with the old data
			try {
				// For the above reason, .loadData() should only save loaded
				// data if the data is valid
				module.loadData();
			} catch (err) {
				cli.log(`Error loading data in ${module.name}:`);
				cli.log(err);
			}
		});
	}
}

module.exports = new ModuleManager();
