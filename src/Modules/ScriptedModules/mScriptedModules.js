var Module = require('../../module.js');

class ScriptedModules extends Module {
	constructor() {
		super({
			name: 'ScriptedModules',
			webname: 'ScriptedModules',
			source: 'ScriptedModules.html',
		});
		
		this.scriptsToShow = [
			'Channel Party',
			'Image Display',
			'Image Dropper',
			'Text Display',
			'Censor',
			// 'Parrot Mate',
		];
		
		this.scriptsData = {};
	}
	
	postload() {
		Object.keys(this.moduleManager.clientModules).forEach(moduleName => {
			if (this.scriptsToShow.includes(moduleName)) {
				this.scriptsData[moduleName] =
					this.moduleManager.clientModules[moduleName];
			}
		});
		
		this.onClientAttached(socket => {
			socket.emit('scriptList', this.scriptsData);
		});
	}
}

module.exports = new ScriptedModules();
