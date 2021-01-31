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
