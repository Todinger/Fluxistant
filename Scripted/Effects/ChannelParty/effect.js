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
		this.forwardSimpleCommand('hype', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])]);
		this.forwardSimpleCommand('epyh', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])]);
		
		this.registerCommand('party', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user, level) => {
				this.broadcastEvent('hype', level);
			}
		);
		this.registerCommand('ytrap', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user, level) => {
				this.broadcastEvent('epyh');
			}
		);
		this.registerCommand('stophype', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user, level) => {
				this.broadcastEvent('endHype');
			}
		);
		this.registerCommand('finish', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user, level) => {
				this.broadcastEvent('finish');
			}
		);
		
		this.registerCommand('fxvol', [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			(user, volume) => {
				this.broadcastEvent('fxvol', { username: user.name, volume });
			}
		);
	}
}

module.exports = new ChannelParty();
