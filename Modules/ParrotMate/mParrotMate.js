var Module = require('../../module.js');

const USER_COMMANDS_FILE = "commands.json";
const PARROT_IMAGE_URL = "/assets/image-display/Parrot.png";
const WWT_COOLDOWN_DURATION = 4000;

class ParrotMate extends Module {
	constructor() {
		super({
			name: 'Parrot Mate',
			webname: 'parrot',
			source: 'parrot.html',
			tags: ['imgdisp'],
		});
		
		this.whatWasThatCooldownActive = false;
	}
	
	forwardSequenceCommand(cmd) {
		this.broadcastEvent('playSequence', cmd.sequence);
	}
	
	loadData() {
		this.commandManager.loadFile(
			USER_COMMANDS_FILE,
			cmd => this.forwardSequenceCommand(cmd)
		);
	}
	
	load() {
		// this.registerCommand({
		// 	cmdname: 'parrottime',
		// 	filters: [Module.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
		// 	callback: (user, delay) => {
		// 		if (isNaN(delay)) {
		// 			this.tell(user, `Please enter a number for the delay value.`);
		// 			this.error(`Bad command by ${user.name}: '${delay}' is not a number`);
		// 		} else {
		// 			this.broadcastEvent('setDelay', Number(delay));
		// 		}
		// 	}
		// });
		//
		// this.registerCommand({
		// 	cmdname: 'parrotoffset',
		// 	filters: [Module.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
		// 	callback: (user, variance) => {
		// 		if (isNaN(variance)) {
		// 			this.error(`Bad command by ${user.name}: '${variance}' is not a number`);
		// 		} else {
		// 			this.broadcastEvent('setVariance', Number(variance));
		// 		}
		// 	}
		// });
		//
		// this.registerCommand({
		// 	cmdname: 'parrotstart',
		// 	filters: [Module.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
		// 	callback: (user) => {
		// 		this.broadcastEvent('play');
		// 	}
		// });
		//
		// this.registerCommand({
		// 	cmdname: 'parrotstop',
		// 	filters: [Module.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
		// 	callback: (user) => {
		// 		this.broadcastEvent('stop');
		// 	}
		// });
		
		this.onClientAttached(socket => {
			socket.on('imgdispDone', url => {
				if (PARROT_IMAGE_URL === url && !this.whatWasThatCooldownActive) {
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
	}
	
	commands = {
		['parrottime']: {
			filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
			callback: (user, delay) => {
				if (isNaN(delay)) {
					this.tell(user, `Please enter a number for the delay value.`);
					this.error(`Bad command by ${user.name}: '${delay}' is not a number`);
				} else {
					this.broadcastEvent('setDelay', Number(delay));
				}
			}
		},
		
		['parrotoffset']: {
			filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
			callback: (user, variance) => {
				if (isNaN(variance)) {
					this.error(`Bad command by ${user.name}: '${variance}' is not a number`);
				} else {
					this.broadcastEvent('setVariance', Number(variance));
				}
			}
		},
		
		['parrotstart']: {
			filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
			callback: () => {
				this.broadcastEvent('play');
			}
		},
		
		['parrotstop']: {
			filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
			callback: () => {
				this.broadcastEvent('stop');
			}
		},
	}
}

module.exports = new ParrotMate();
