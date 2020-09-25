var Effect = require('../../effect.js');

class MyEffect extends Effect {
	constructor() {
		super({
			name: 'Effect Name',
			webname: 'folderName',
			source: 'pageName.html',
		});
	}
	
	load() {
		this._onClientAttached(() => this.broadcastEvent('setTime', this.initialTime));
		
		this.registerCommand('somecmd', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user, value) => {
				this.broadcastEvent('somecmd', `Hello ${value}!`);
			}
		);
		
		// On Ctrl + WinKey + Numpad Add
		this.registerShortcutKey(
			'doThis',
			[
				Effect.Keycodes.VC_CONTROL_L,
				Effect.Keycodes.VC_META_L,
				Effect.Keycodes.VC_KP_ADD
			],
			() => this.broadcastEvent('theySayDoThis', "Any single value")
		);
		
		this.forwardSimpleTwitchEvent('userJoined');
	}
}

module.exports = new MyEffect();
