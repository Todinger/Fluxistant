var Module = require('../../module.js');

class MyModule extends Module {
	constructor() {
		super({
			name: 'Module Name',
			webname: 'folderName',
			source: 'pageName.html',
		});
	}
	
	load() {
		this.onClientAttached(() => this.broadcastEvent('setTime', this.initialTime));
		
		this.registerCommand({
			cmdname: 'somecmd',
			filters: [Module.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			callback: (user, value) => {
				this.broadcastEvent('somecmd', `Hello ${value}!`);
			}
		});
		
		// On Ctrl + WinKey + Numpad Add
		this.registerShortcutKey(
			'doThis',
			[
				Module.Keycodes.VC_CONTROL_L,
				Module.Keycodes.VC_META_L,
				Module.Keycodes.VC_KP_ADD
			],
			() => this.broadcastEvent('theySayDoThis', "Any single value")
		);
		
		this.forwardSimpleTwitchEvent('userJoined');
	}
}

module.exports = new MyModule();
