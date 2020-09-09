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
	}
}

module.exports = new ScriptedEffects();
