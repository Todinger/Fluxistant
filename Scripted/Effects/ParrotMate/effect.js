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
		// this.registerCommand('parrottime', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
		this.registerCommand('t', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user, delay) => {
				if (isNaN(delay)) {
					// TODO: Give the use an error, once we're ready to reveal
					// Fluxistant to the world
					console.error(`Bad command by ${user.name}: '${delay}' is not a number`);
				} else {
					this.broadcastEvent('setDelay', Number(delay));
				}
			}
		);
		// this.registerCommand('parrotoffset', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
		this.registerCommand('o', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user, variance) => {
				if (isNaN(variance)) {
					// TODO: Give the use an error, once we're ready to reveal
					// Fluxistant to the world
					console.error(`Bad command by ${user.name}: '${variance}' is not a number`);
				} else {
					this.broadcastEvent('setVariance', Number(variance));
				}
			}
		);
		// this.registerCommand('parrotstart', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
		this.registerCommand('1', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user) => {
				this.broadcastEvent('play');
			}
		);
		// this.registerCommand('parrotstop', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
		this.registerCommand('2', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user) => {
				this.broadcastEvent('stop');
			}
		);
	}
}

module.exports = new ParrotMate();
