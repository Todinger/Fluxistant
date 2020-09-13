var Effect = require('../../effect.js');

class ChannelParty extends Effect {
	constructor() {
		super({
			name: 'Channel Party',
			webname: 'party',
			source: 'party.html',
		});
	}
	
	load() {
		this.forwardSimpleTwitchEvent('userJoined');
		this.forwardSimpleTwitchEvent('userLeft');
		this.registerCommand('a', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])], user => {
			this.broadcastEvent('show', 'Channel Party');
		});
		this.registerCommand('b', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])], user => {
			this.broadcastEvent('hide', 'Channel Party');
		});
		this.forwardSimpleCommand('hype', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])]);
		this.forwardSimpleCommand('epyh', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])]);
		
		this.registerCommand('h', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user, level) => {
				this.broadcastEvent('hype', level);
			}
		);
		this.registerCommand('e', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user, level) => {
				this.broadcastEvent('epyh');
			}
		);
		this.registerCommand('s', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user, level) => {
				this.broadcastEvent('endHype');
			}
		);
		this.registerCommand('q', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user, level) => {
				this.broadcastEvent('finish');
			}
		);
		
		this.registerCommand('z', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(username, volume) => {
				this.broadcastEvent('fxvol', { username, volume });
			}
		);
	}
}

module.exports = new ChannelParty();
