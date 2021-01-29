var Module = require('../../module.js');

class ChannelParty extends Module {
	constructor() {
		super({
			name: 'Channel Party',
			webname: 'party',
			source: 'party.html',
			zindex: 10,
		});
	}
	
	load() {
		this.forwardSimpleTwitchEvent('userJoined');
		this.forwardSimpleTwitchEvent('userLeft');
		
		// this.forwardSimpleCommand('hype', [Module.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])]);
		// this.forwardSimpleCommand('epyh', [Module.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])]);
		//
		// this.registerCommand({
		// 	cmdname: 'party',
		// 	filters: [Module.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
		// 	callback: (user, level) => {
		// 		this.broadcastEvent('hype', level);
		// 	},
		// });
		// this.registerCommand({
		// 	cmdname: 'ytrap',
		// 	filters: [Module.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
		// 	callback: (user, level) => {
		// 		this.broadcastEvent('epyh');
		// 	},
		// });
		// this.registerCommand({
		// 	cmdname: 'stophype',
		// 	filters: [Module.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
		// 	callback: (user, level) => {
		// 		this.broadcastEvent('endHype');
		// 	}
		// });
		// this.registerCommand({
		// 	cmdname: 'finish',
		// 	filters: [Module.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
		// 	callback: (user, level) => {
		// 		this.broadcastEvent('finish');
		// 	}
		// });
	}
	
	commands = {
		['hype']: {
			aliases: ['party'],
			filters: [this.filterDesc('isOneOf', ['yecatsmailbox', 'fluxistence'])],
			callback: (user, level) => this.broadcastEvent('hype', level),
		},
		
		['epyh']: {
			aliases: ['ytrap'],
			filters: [this.filterDesc('isOneOf', ['yecatsmailbox', 'fluxistence'])],
			callback: () => this.broadcastEvent('epyh'),
		},
		
		['stophype']: {
			filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
			callback: () => {
				this.broadcastEvent('endHype');
			}
		},
		
		['finish']: {
			filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
			callback: () => {
				this.broadcastEvent('finish');
			}
		},
	}
}

module.exports = new ChannelParty();
