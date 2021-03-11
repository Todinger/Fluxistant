var Module = require('../../module.js');

class ChannelParty extends Module {
	constructor() {
		super({
			name: 'Channel Party',
			webname: 'party',
			source: 'party.html',
			zindex: 10,
			webSounds: true,
			enabledByDefault: false,
			configurable: false,
		});
	}
	
	enable() {
		// TODO: Remove this since there's no "disable" button for it
		this.forwardSimpleTwitchEvent('userJoined');
		this.forwardSimpleTwitchEvent('userLeft');
	}
	
	commands = {
		['hype']: {
			name: 'Start Party / Increase Level',
			description: "Increases the hype level by 1. Starts the channel party if it's off.",
			aliases: ['party'],
			filters: [this.filterDesc('isOneOf', ['yecatsmailbox', 'fluxistence'])],
			callback: (user, level) => this.broadcastEvent('hype', level),
		},
		
		['epyh']: {
			name: 'Decrease Level',
			description: "Decreases the hype level by 1. Ends the channel party if it reaches 0.",
			aliases: ['ytrap'],
			filters: [this.filterDesc('isOneOf', ['yecatsmailbox', 'fluxistence'])],
			callback: () => this.broadcastEvent('epyh'),
		},
		
		['stophype']: {
			name: 'Stop Party',
			description: 'Stops the channel party immediately.',
			filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
			callback: () => {
				this.broadcastEvent('endHype');
			}
		},
		
		['finish']: {
			name: 'Play Finish Video',
			description: 'Stops the channel party and shows the ending video.',
			filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
			callback: () => {
				this.broadcastEvent('finish');
			}
		},
	}
}

module.exports = new ChannelParty();
