const Module = requireMain('module');

class ChatAlerts extends Module {
	constructor() {
		super({
			name: 'Chat Alerts',
			// webname: 'folderName',
			// source: 'pageName.html',
			enabled: false,
			enabledByDefault: false,
			configurable: false,
		});
	}
}

module.exports = new ChatAlerts();
