var Effect = require('../../effect.js');

const PARROT_IMAGE_URL = "/assets/image-display/Parrot.png";
const WWT_COOLDOWN_DURATION = 4000;

class ParrotMate extends Effect {
	constructor() {
		super({
			name: 'Parrot Mate',
			webname: 'parrot',
			source: 'parrot.html',
			tags: ['imgdisp'],
		});
		
		this.whatWasThatCooldownActive = false;
	}
	
	load() {
		this.registerCommand('parrottime', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user, delay) => {
				if (isNaN(delay)) {
					this.tell(user, `Please enter a number for the delay value.`);
					console.error(`Bad command by ${user.name}: '${delay}' is not a number`);
				} else {
					this.broadcastEvent('setDelay', Number(delay));
				}
			}
		);
		
		this.registerCommand('parrotoffset', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
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
		
		this.registerCommand('parrotstart', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user) => {
				this.broadcastEvent('play');
			}
		);
		
		this.registerCommand('parrotstop', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user) => {
				this.broadcastEvent('stop');
			}
		);
		
		this._onClientAttached(socket => {
			socket.on('imgdispDone', url => {
				if (PARROT_IMAGE_URL == url && !this.whatWasThatCooldownActive) {
					this.whatWasThatCooldownActive = true;
					setTimeout(
						() => this.broadcastEvent('playSequence', 'what'),
						500);
					setTimeout(
						() => this.whatWasThatCooldownActive = false,
						WWT_COOLDOWN_DURATION);
				}
			});
		});
		this.registerCommand('parrot', [],
			() => {
			});
	}
}

module.exports = new ParrotMate();
