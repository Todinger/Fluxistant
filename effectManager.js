const fs = require('fs');
const path = require('path');
const assert = require('assert').strict;
const urljoin = require('url-join');
const cli = require('./cliManager');
const KEYCODES = require('./enums').KEYCODES;
const KeyboardManager = require('./keyboardManager');
const Utils = require('./utils');

// Every Effect needs to have a file by this name in its root directory
const EFFECT_MAIN_FILENAME = "effect.js";

// Loads, holds and manages all the various Effects in the system.
class EffectManager {
	constructor() {
		// Holds all the effects
		this.effects = {};
		
		// Holds web access information for all the effects that have a web
		// presence (basically everything that has a webname and source
		// configured)
		this.clientEffects = {};
		
		// Holds all the available tags that clients can attached to, along with
		// which effects have them
		this.tags = {};
		
		// Ctrl + WinKey + F5 = Have all effects (re)load their data
		KeyboardManager.registerShortcut(
			'EffectManager:ReloadData',
			[
				KEYCODES.VC_CONTROL_L,
				KEYCODES.VC_META_L,
				KEYCODES.VC_F5
			],
			() => this.reloadAllEffectData()
		);
	}
	
	// For validation purposes and to prevent collisions
	nameExists(name) {
		return name in this.effects;
	}
	
	// For validation purposes and to prevent collisions
	webnameExists(webname) {
		return Object.values(this.effects).filter(
			effect => effect.webname == webname).length > 0;
	}
	
	// Loads a single Effect, with all that entails.
	// 
	// Parameters:
	// 	fxdir		Path of the root folder of the effect (where effect.js is).
	// 	fxfile		Path to the Effect's effect.js file
	// 				(basically fxdir/effect.js).
	// 	webPrefix	URL to register all effects under. If set to, for example,
	// 				"/fx/", then all the web URLs will begin with "/fx", so for
	// 				example an Effect with webname = "hellow" and
	// 				source = "world.html" will be accessible at the URL
	// 				"localhost:3333/fx/hello/world.html" (assuming the server is
	// 				running locally and listening on port 3333).
	// 	app			Object used to register web access points URLs).
	// 	express		User in conjunction with app to register URLs.
	_loadEffect(fxdir, fxfile, webPrefix, app, express) {
		// This loads the Effect from file and invokes its constructor
		let effect = require('./' + fxfile);
		
		// If the effect is disabled we ignore it completely
		if (!effect.enabled) {
			return;
		}
		
		// Validation: Ensure there are no duplicate registrations
		assert(!this.nameExists(effect.name),
			`Ambiguous effect name: '${effect.name}'`);
		
		// Handling of the web part of the loaded Effect, if it has one
		if (effect.webname) {
			// Validation: Ensure there are no duplicate registrations
			assert(!this.webnameExists(effect.webname),
				`Web name already taken: '${effect.webname}'`);
			
			// Registers the access point (URL) for the Effect directory
			let webdir = urljoin(webPrefix, effect.webname);
			app.use(webdir,
				express.static(path.join(__dirname, fxdir)));
			
			// Saves the description of the web properties, to be used later by
			// the ScriptedEffects aggragator to display them
			this.clientEffects[effect.name] = {
				webname: effect.webname,
				source: urljoin(webdir, effect.source),
				zindex: effect.zindex,
			}
		}
		
		// Registers all the tags declared by the loaded Effect (all the tags
		// we have are collected from Effects here)
		if (effect.tags) {
			effect.tags.forEach(tag => {
				if (!(tag in this.tags)) {
					this.tags[tag] = [];
				}
				
				this.tags[tag].push(effect);
			});
		}
		
		// Initialize the external values the Effect needs before letting it
		// perform its own loading
		effect.effectManager = this;
		effect.workdir = fxdir;
		
		// Let the Effect load everything it needs
		// We don't catch errors here because if an Effect has a critical
		// problem then we want to know about it immediately and fix it before
		// starting the server
		effect.preload();
		effect.loadData(); // NOTE: EFFECTS SHOULD ONLY SAVE DATA IF IT IS VALID 
		effect.load();
		
		// Save the effect and announce it to show success
		this.effects[effect.name] = effect;
		cli.log(`Loaded effect: ${effect.name}`);
	}
	
	// Loads all the Effects, we have in the system, with all that entails.
	// This function searches for any subfolder of the given effectsdir that
	// has a file called <EFFECT_MAIN_FILENAME> and loads each one it finds.
	// If you want to add an Effect called "ABC", add an "ABC" directory under
	// <effectsdir> and put an "effect.js" file in it as described in the
	// "effect.js" file in the same folder as this file.
	// 
	// Parameters:
	// 	effectsdir	Path to search in.
	// 	webPrefix	URL to register all effects under. If set to, for example,
	// 				"/fx/", then all the web URLs will begin with "/fx", so for
	// 				example an Effect with webname = "hellow" and
	// 				source = "world.html" will be accessible at the URL
	// 				"localhost:3333/fx/hello/world.html" (assuming the server is
	// 				running locally and listening on port 3333).
	// 	app			Object used to register web access points URLs).
	// 	express		User in conjunction with app to register URLs.
	loadAll(webPrefix, effectsdir, app, express) {
		// Load all the effects in the given directory
		let subdirs = Utils.getDirectories(effectsdir);
		subdirs.forEach(subdir => {
			let fxdir = path.join(effectsdir, subdir);
			let fxfile = path.join(fxdir, EFFECT_MAIN_FILENAME);
			if (fs.existsSync(fxfile)) {
				this._loadEffect(fxdir, fxfile, webPrefix, app, express);
			}
		});
		
		this.postloadAll();
	}
	
	// Runs over all the previously loaded Effects and invoke their postload()
	// function, which is meant to be called only after all the Effects have
	// loaded.
	postloadAll() {
		Object.values(this.effects).forEach(effect => {
			effect.postload();
		});
	}
	
	// Attaches the given client (<socket>) to the Effect called <effectName>.
	attachClient(effectName, socket) {
		if (this.nameExists(effectName)) {
			this.effects[effectName].attachClient(socket, 'direct');
		} else {
			cli.warn(`Unknown effect: ${effectName}`);
		}
	}
	
	// Attaches the given client to all the Effects tagged by the given tag.
	attachClientToTag(tag, socket) {
		if (tag in this.tags) {
			this.tags[tag].forEach(effect => effect.attachClient(socket, 'tag'));
		} else {
			cli.warn(`Unknown tag: ${tag}`);
		}
	}
	
	// Invokes the .loadData() function of all the loaded Effects.
	// This is meant to refresh external data that is read by the Effects during
	// runtime.
	reloadAllEffectData() {
		Object.values(this.effects).forEach(effect => {
			// We do catch errors here because all the loaded Effects are
			// currently already running with valid data from the last time they
			// had .loadData() called, so if the data files have changed in a
			// way that causes an error, we can simply show that error and not
			// load them and the program will be able to continue running fine
			// with the old data
			try {
				// For the above reason, .loadData() should only save loaded
				// data if the data is valid
				effect.loadData();
			} catch (err) {
				cli.log(`Error loading data in ${effect.name}:`);
				cli.log(err);
			}
		});
	}
}

module.exports = new EffectManager();
