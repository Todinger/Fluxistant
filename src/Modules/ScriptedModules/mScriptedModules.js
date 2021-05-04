const Module = requireMain('module');

class ScriptedModules extends Module {
	constructor() {
		super({
			name: 'ScriptedModules',
			webname: 'ScriptedModules',
			source: 'ScriptedModules.html',
			configurable: false,
		});
		
		// TODO: Make this configurable
		this.modulesToShow = [
			// 'Channel Party',
			'Image Display',
			'Image Dropper',
			'Text Display',
			'Wheel',
			// 'Censor',
			// 'Parrot Mate',
		];
		
		this.scriptsData = {};
	}
	
	postload() {
		Object.keys(this.moduleManager.clientModules).forEach(moduleName => {
			if (this.modulesToShow.includes(moduleName)) {
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
