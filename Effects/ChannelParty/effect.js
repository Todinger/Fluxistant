var Effect = require('../../effect.js');

class ChannelParty extends Effect {
	constructor() {
		super({
			name: 'Channel Party',
			webname: 'party',
			source: 'party.html',
			zindex: 10,
			enabled: false,
		});
	}
	
	load() {
		this.forwardSimpleTwitchEvent('userJoined');
		this.forwardSimpleTwitchEvent('userLeft');
		this.forwardSimpleCommand('hype', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])]);
		this.forwardSimpleCommand('epyh', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])]);
		
		this.registerCommand({
			cmdname: 'party',
			filters: [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			callback: (user, level) => {
				this.broadcastEvent('hype', level);
			},
		});
		this.registerCommand({
			cmdname: 'ytrap',
			filters: [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			callback: (user, level) => {
				this.broadcastEvent('epyh');
			},
		});
		this.registerCommand({
			cmdname: 'stophype',
			filters: [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			callback: (user, level) => {
				this.broadcastEvent('endHype');
			}
		});
		this.registerCommand({
			cmdname: 'finish',
			filters: [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			callback: (user, level) => {
				this.broadcastEvent('finish');
			}
		});
	}
}

module.exports = new ChannelParty();