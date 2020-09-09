var Effect = require('../effect.js');

class ScriptedEffects extends Effect {
	constructor() {
		super({
			name: 'ScriptedEffects',
		});
		
		this.scriptsToShow = [
			'Channel Party',
			'Parrot Mate',
		];
	}
	
	load() {
		this._onTwitchEvent('userJoined', username => {
			this._broadcastEvent('userJoined', username);
		});
		this._onTwitchEvent('userLeft', username => {
			this._broadcastEvent('userLeft', username);
		});
	}
}

module.exports = new ScriptedEffects();
