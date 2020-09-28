const fs = require('fs');
const path = require('path');
const assert = require('assert').strict;
const urljoin = require('url-join');

// Taken from:
// https://stackoverflow.com/questions/18112204/get-all-directories-within-directory-nodejs/24594123
const getDirectories = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

const EFFECT_MAIN_FILENAME = "effect.js";

class EffectManager {
	constructor() {
		this.effects = {};
		this.clientEffects = {};
		this.tags = {};
	}
	
	nameExists(name) {
		return name in this.effects;
	}
	
	webnameExists(webname) {
		return Object.values(this.effects).filter(
			effect => effect.webname == webname).length > 0;
	}
	
	_loadEffect(fxdir, fxfile, webPrefix, app, express) {
		let effect = require('./' + fxfile);
		assert(!this.nameExists(effect.name),
			`Ambiguous effect name: '${effect.name}'`);
		
		if (effect.webname) {
			assert(!this.webnameExists(effect.webname),
				`Web name already taken: '${effect.webname}'`);
			
			let webdir = urljoin(webPrefix, effect.webname);
			app.use(webdir,
				express.static(path.join(__dirname, fxdir)));
			
			this.clientEffects[effect.name] = {
				webname: effect.webname,
				source: urljoin(webdir, effect.source),
				zindex: effect.zindex,
			}
		}
		
		if (effect.tags) {
			effect.tags.forEach(tag => {
				if (!(tag in this.tags)) {
					this.tags[tag] = [];
				}
				
				this.tags[tag].push(effect);
			});
		}
		
		effect.effectManager = this;
		effect.workdir = fxdir;
		effect.load();
		this.effects[effect.name] = effect;
		
		console.log(`Loaded effect: ${effect.name}`);
	}
	
	loadAll(webPrefix, effectsdir, app, express) {
		// Load all the effects in the given directory
		let subdirs = getDirectories(effectsdir);
		subdirs.forEach(subdir => {
			let fxdir = path.join(effectsdir, subdir);
			let fxfile = path.join(fxdir, EFFECT_MAIN_FILENAME);
			if (fs.existsSync(fxfile)) {
				this._loadEffect(fxdir, fxfile, webPrefix, app, express);
			}
		});
		
		this.postloadAll();
	}
	
	postloadAll() {
		Object.values(this.effects).forEach(effect => {
			effect.postload();
		});
	}
	
	attachClient(effectName, socket) {
		if (this.nameExists(effectName)) {
			this.effects[effectName].attachClient(socket);
		} else {
			console.warn(`Unknown effect: ${effectName}`);
		}
	}
	
	attachClientToTag(tag, socket) {
		if (tag in this.tags) {
			this.tags[tag].forEach(effect => effect.attachClient(socket));
		} else {
			console.warn(`Unknown tag: ${tag}`);
		}
	}
}

module.exports = new EffectManager();
