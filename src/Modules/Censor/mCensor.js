const Module = require('../../module.js');
const urljoin = require('url-join');
const Utils = require('../../utils');

const CENSOR_FILENAME = 'censors.json';

const CENSOR_DEFAULTS = {
	image: {
		top: 0,
		left: 0,
	},
};


class Censor extends Module {
	constructor() {
		super({
			name: 'Censor',
			webname: 'censor',
			source: 'censor.html',
		});
		
		this.censorData = {};
		this.censors = {};
	}
	
	toggleCensor(id) {
		this.broadcastEvent('toggleCensor', id);
	}
	
	preload() {
		this.imageDirURL = this.registerAssetDir('Images', 'images');
	}
	
	loadData() {
		try {
			let newData = this.readJSON(CENSOR_FILENAME);
			let changes = Utils.oldNewSplit(this.censorData, newData);
			
			Object.keys(changes.remove).forEach(id => {
				if (this.censorData[id].shortcut) {
					this.unregisterShortcutKey(`Censor: ${id}`);
				}
				
				this.broadcastEvent('removeCensor', id);
			});
			
			Object.keys(changes.add).forEach(id => {
				let cd = Utils.clone(changes.add[id]);
				cd.id = id;
				Utils.applyDefaults(cd, CENSOR_DEFAULTS);
				
				cd.image.url = urljoin(this.imageDirURL, cd.image.url);
				
				if (cd.shortcut) {
					for (let i = 0; i < cd.shortcut.length; i++) {
						if (!cd.shortcut[i].startsWith("VC_")) {
							cd.shortcut[i] = "VC_" + cd.shortcut[i];
						}
					}
					
					this.registerShortcutKey(
						`Censor: ${id}`,
						cd.shortcut.map(name => Module.Keycodes[name]),
						() => this.toggleCensor(id)
					);
				}
				
				this.censors[id] = cd;
			});
			
			this.censorData = newData;
			this.log('Loaded censor data.');
		} catch (err) {
			this.error('Failed to read censor data:');
			this.error(err);
		}
	}
	
	load() {
		this.onClientAttached(socket => {
			Object.values(this.censors).forEach(cd => {
				socket.emit('setCensor', cd);
			});
		});
	}
}

module.exports = new Censor();
