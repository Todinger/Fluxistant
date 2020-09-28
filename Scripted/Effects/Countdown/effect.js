var Effect = require('../../effect.js');

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;


class Countdown extends Effect {
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
		this._onClientAttached(() => this.broadcastEvent('setTime', this.initialTime));
		
		this.registerCommand('settime', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user, time) => {
				if (isNaN(time)) {
					this.log(`User ${user.name} used bad arguments: "addtime ${time}"`);
					return;
				}
				
				this.broadcastEvent('setTime', Number(time) * MINUTES);
			}
		);
		
		this.registerCommand('addtime', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user, time) => {
				if (isNaN(time)) {
					this.log(`User ${user.name} used bad arguments: "addtime ${time}"`);
					return;
				}
				
				this.broadcastEvent('offsetTime', Number(time) * MINUTES);
			}
		);
		
		this.registerCommand('subtracttime', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user, time) => {
				if (isNaN(time)) {
					this.log(`User ${user.name} used bad arguments: "addtime ${time}"`);
					return;
				}
				
				this.broadcastEvent('offsetTime', -Number(time) * MINUTES);
			}
		);
		
		this.registerShortcutKey(
			'addTime',
			[
				Effect.Keycodes.VC_CONTROL_L,
				Effect.Keycodes.VC_META_L,
				Effect.Keycodes.VC_KP_ADD
			],
			() => this.broadcastEvent('offsetTime', Countdown.KEY_OFFSET_AMOUNT)
		);
		
		this.registerShortcutKey(
			'subtractTime',
			[
				Effect.Keycodes.VC_CONTROL_L,
				Effect.Keycodes.VC_META_L,
				Effect.Keycodes.VC_KP_SUBTRACT
			],
			() => this.broadcastEvent('offsetTime', -Countdown.KEY_OFFSET_AMOUNT)
		);
		
		this.registerShortcutKey(
			'resetTime',
			[
				Effect.Keycodes.VC_CONTROL_L,
				Effect.Keycodes.VC_META_L,
				Effect.Keycodes.VC_KP_0
			],
			() => this.broadcastEvent('setTime', this.initialTime)
		);
	}
}

module.exports = new Countdown();
