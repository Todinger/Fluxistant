const fs = require('fs');
const path = require('path');
const assert = require('assert').strict;

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
	}
	
	nameExists(name) {
		return name in this.effects;
	}
	
	webnameExists(webname) {
		return Object.values(this.effects).filter(
			effect => effect.webname = webname).length > 0;
	}
	
	loadAll(app, express, webPrefix, effectsdir) {
		let subdirs = getDirectories(effectsdir);
		subdirs.forEach(subdir => {
			let fxdir = path.join(effectsdir, subdir);
			let fxfile = path.join(fxdir, EFFECT_MAIN_FILENAME);
			if (fs.existsSync(fxfile)) {
				let effect = require('./' + fxfile);
				assert(!this.nameExists(effect.name),
					`Ambiguous effect name: '${effect.name}'`);
				assert(!this.webnameExists(effect.webname),
					`Web name already taken: '${effect.webname}'`);
				
				app.use(webPrefix + effect.webname,
					express.static(path.join(__dirname, fxdir)));
				
				effect.load();
				this.effects[effect.name] = effect;
				console.log(`Loaded effect: ${effect.name}`);
			}
		});
	}
}

module.exports = new EffectManager();
