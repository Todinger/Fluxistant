var Effect = require('../../effect.js');

class ParrotMate extends Effect {
	constructor() {
		super({
			name: 'Parrot Mate',
			webname: 'parrot',
			source: 'parrot.html',
		});
	}
	
	load() {
	}
}

module.exports = new ParrotMate();
