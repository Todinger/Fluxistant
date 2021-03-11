const Module = requireMain('module');

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
			webSounds: true,
			enabledByDefault: false,
			configurable: false,
		});
		
		this.whatWasThatCooldownActive = false;
	}
	
	forwardSequenceCommand(cmd) {
		this.broadcastEvent('playSequence', cmd.sequence);
	}
	
	// TODO: Replace this with new command (or even better, function) system
	// loadData() {
	enable() {
		this.commandManager.loadFile(
			USER_COMMANDS_FILE,
			cmd => this.forwardSequenceCommand(cmd)
		);
	}
	
	load() {
		this.onClientAttached(socket => {
			socket.on('imgdispDone', url => {
				if (this.enabled) {
					if (PARROT_IMAGE_URL === url && !this.whatWasThatCooldownActive) {
						this.whatWasThatCooldownActive = true;
						setTimeout(
							() => this.broadcastEvent('playSequence', 'what'),
							500);
						setTimeout(
							() => this.whatWasThatCooldownActive = false,
							WWT_COOLDOWN_DURATION);
					}
				}
			});
		});
	}
	
	commands = {
		['parrottime']: {
			name: 'Set Interval Base',
			description: 'The delay (ms) between sequences is chosen randomly from (Base - Variance, Base + Variance).',
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
			name: 'Set Interval Variance',
			description: 'The delay (ms) between sequences is chosen randomly from (Base - Variance, Base + Variance).',
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
			name: 'Enable Random Sequences',
			description: 'Starts the parrot playing a random sequence at intervals.',
			filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
			callback: () => {
				this.broadcastEvent('play');
			}
		},
		
		['parrotstop']: {
			name: 'Disable Random Sequences',
			description: 'Stops the parrot playing a random sequence at intervals.',
			filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
			callback: () => {
				this.broadcastEvent('stop');
			}
		},
	}
}

module.exports = new ParrotMate();
