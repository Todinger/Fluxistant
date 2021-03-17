const Module = requireMain('module');

const SECONDS = 1;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;

const USER_SECONDS = 1000;

const DESCRIPTION =
`Creates a text overlay that you can put in your streaming program (e.g. OBS) that shows a countdown timer.

You can set its initial value and change its current value via commands, keyboard shortcuts or any other type of trigger you want.

To add the overlay to your stream, add a browser source and set it to:
http://localhost:3333/mod/countdown/Countdown.html

(Note: the port 3333 is the default one, but if you change it in the main settings,
you will need to adjust that address accordingly.`;

class Countdown extends Module {
	constructor() {
		super({
			name: 'Countdown',
			webname: 'countdown',
			source: 'countdown.html',
			description: DESCRIPTION,
		});
		
		this.initialTime = 0;
		this.offsetValue = 0;
	}
	
	defineModConfig(modConfig) {
		modConfig.addNumber('initialTime', 12 * HOURS)
			.setName('Initial Time (Seconds)')
			.setDescription('The starting value of the countdown timer (will be displaying in hh:mm:ss format)');
		modConfig.addNumber('offsetValue', 30 * MINUTES)
			.setName('Offset on Key Presses')
			.setDescription('Amount of seconds to add/subtract from the timer when pressing the shortcut keys');
	}
	
	loadModConfig(conf) {
		this.initialTime = conf.initialTime * USER_SECONDS;
		this.offsetValue = conf.offsetValue * USER_SECONDS;
	}
	
	load() {
		this.onClientAttached(() => this.broadcastEvent('setTime', this.initialTime));
		
		this.registerShortcutKey(
			'addTime',
			[
				Module.Keycodes.VC_CONTROL_L,
				Module.Keycodes.VC_META_L,
				Module.Keycodes.VC_KP_ADD
			],
			() => this.broadcastEvent('offsetTime', this.offsetValue)
		);
		
		this.registerShortcutKey(
			'subtractTime',
			[
				Module.Keycodes.VC_CONTROL_L,
				Module.Keycodes.VC_META_L,
				Module.Keycodes.VC_KP_SUBTRACT
			],
			() => this.broadcastEvent('offsetTime', -this.offsetValue)
		);
		
		this.registerShortcutKey(
			'resetTime',
			[
				Module.Keycodes.VC_CONTROL_L,
				Module.Keycodes.VC_META_L,
				Module.Keycodes.VC_KP_0
			],
			() => this.broadcastEvent('setTime', this.initialTime)
		);
	}
	
	commands = {
		['settime']: {
			name: 'Set Time',
			description: 'Sets the current time of the countdown timer.',
			filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
			callback: (user, time) => {
				if (isNaN(time)) {
					this.log(`User ${user.name} used bad arguments: "settime ${time}"`);
					return;
				}
				
				this.broadcastEvent('setTime', Number(time) * MINUTES);
			},
		},
		
		['addtime']: {
			name: 'Add Time',
			description: 'Adds to the current time of the countdown timer.',
			filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
			callback: (user, time) => {
				if (isNaN(time)) {
					this.log(`User ${user.name} used bad arguments: "addtime ${time}"`);
					return;
				}
				
				this.broadcastEvent('offsetTime', Number(time) * MINUTES);
			},
		},
		
		['subtracttime']: {
			name: 'Subtract Time',
			description: 'Subtracts from the current time of the countdown timer.',
			filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
			callback: (user, time) => {
				if (isNaN(time)) {
					this.log(`User ${user.name} used bad arguments: "subtracttime ${time}"`);
					return;
				}
				
				this.broadcastEvent('offsetTime', -Number(time) * MINUTES);
			},
		},
	}
}

module.exports = new Countdown();
