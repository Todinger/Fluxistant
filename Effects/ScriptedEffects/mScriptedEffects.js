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
			'Censor',
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
		
		this.onClientAttached(socket => {
			socket.emit('scriptList', this.scriptsData);
		});
	}
}

module.exports = new ScriptedEffects();
