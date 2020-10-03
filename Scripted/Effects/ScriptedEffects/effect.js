var Effect = require('../../effect.js');

class ScriptedEffects extends Effect {
	constructor() {
		super({
			name: 'ScriptedEffects',
			webname: 'ScriptedEffects',
			source: 'ScriptedEffects.html',
		});
		
		this.scriptsToShow = [
			'Channel Party',
			'Image Display',
			'Image Dropper',
			'Text Display',
			// 'Parrot Mate',
		];
		
		this.scriptsData = {};
	}
	
	postload() {
		Object.keys(this.effectManager.clientEffects).forEach(effectName => {
			if (this.scriptsToShow.includes(effectName)) {
				this.scriptsData[effectName] =
					this.effectManager.clientEffects[effectName];
			}
		});
		
		this._onClientAttached(socket => {
			socket.emit('scriptList', this.scriptsData);
		});
	}
}

module.exports = new ScriptedEffects();
