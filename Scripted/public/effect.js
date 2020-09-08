var Effect = require('../effect.js');

class ScriptedEffects extends Effect {
	constructor() {
		super({
			name: 'ScriptedEffects',
		});
	}
	
	load() {
		this.registerCommand('s', [Effect.Filters.isAtLeastMod()], user => {
			this._broadcastEvent('show', 'Channel Party');
		});
		this.registerCommand('h', [Effect.Filters.isAtLeastMod()], user => {
			this._broadcastEvent('hide', 'Channel Party');
		});
	}
}

module.exports = new ScriptedEffects();
