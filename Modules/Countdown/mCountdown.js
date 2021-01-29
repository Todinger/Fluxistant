var Module = require('../../module.js');

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;


class Countdown extends Module {
	static get KEY_OFFSET_AMOUNT() { return 30 * MINUTES; }
	
	constructor() {
		super({
			name: 'Countdown',
			webname: 'countdown',
			source: 'countdown.html',
		});
		
		this.initialTime = 12 * HOURS;
	}
	
	load() {
		this.onClientAttached(() => this.broadcastEvent('setTime', this.initialTime));
		
		// this.registerCommand({
		// 	cmdname: 'settime',
		// 	filters: [Module.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
		// 	callback: (user, time) => {
		// 		if (isNaN(time)) {
		// 			this.log(`User ${user.name} used bad arguments: "addtime ${time}"`);
		// 			return;
		// 		}
		//
		// 		this.broadcastEvent('setTime', Number(time) * MINUTES);
		// 	},
		// });
		//
		// this.registerCommand({
		// 	cmdname: 'addtime',
		// 	filters: [Module.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
		// 	callback: (user, time) => {
		// 		if (isNaN(time)) {
		// 			this.log(`User ${user.name} used bad arguments: "addtime ${time}"`);
		// 			return;
		// 		}
		//
		// 		this.broadcastEvent('offsetTime', Number(time) * MINUTES);
		// 	},
		// });
		//
		// this.registerCommand({
		// 	cmdname: 'subtracttime',
		// 	filters: [Module.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
		// 	callback: (user, time) => {
		// 		if (isNaN(time)) {
		// 			this.log(`User ${user.name} used bad arguments: "addtime ${time}"`);
		// 			return;
		// 		}
		//
		// 		this.broadcastEvent('offsetTime', -Number(time) * MINUTES);
		// 	},
		// });
		
		this.registerShortcutKey(
			'addTime',
			[
				Module.Keycodes.VC_CONTROL_L,
				Module.Keycodes.VC_META_L,
				Module.Keycodes.VC_KP_ADD
			],
			() => this.broadcastEvent('offsetTime', Countdown.KEY_OFFSET_AMOUNT)
		);
		
		this.registerShortcutKey(
			'subtractTime',
			[
				Module.Keycodes.VC_CONTROL_L,
				Module.Keycodes.VC_META_L,
				Module.Keycodes.VC_KP_SUBTRACT
			],
			() => this.broadcastEvent('offsetTime', -Countdown.KEY_OFFSET_AMOUNT)
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
			filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
			callback: (user, time) => {
				if (isNaN(time)) {
					this.log(`User ${user.name} used bad arguments: "addtime ${time}"`);
					return;
				}
				
				this.broadcastEvent('setTime', Number(time) * MINUTES);
			},
		},
		
		['addtime']: {
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
			filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
			callback: (user, time) => {
				if (isNaN(time)) {
					this.log(`User ${user.name} used bad arguments: "addtime ${time}"`);
					return;
				}
				
				this.broadcastEvent('offsetTime', -Number(time) * MINUTES);
			},
		},
	}
}

module.exports = new Countdown();
