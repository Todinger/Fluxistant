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
		this.registerCommand('a', [Effect.Filters.isUser('fluxistence')], user => {
			this.broadcastEvent('show', 'Channel Party');
		});
		this.registerCommand('b', [Effect.Filters.isUser('fluxistence')], user => {
			this.broadcastEvent('hide', 'Channel Party');
		});
		this.forwardSimpleCommand('hype', [Effect.Filters.isUser('yecatsmailbox')]);
		this.forwardSimpleCommand('epyh', [Effect.Filters.isUser('yecatsmailbox')]);
		
		this.registerCommand('h', [Effect.Filters.isUser('fluxistence')],
			(user, level) => {
				this.broadcastEvent('hype', level);
			}
		);
		this.registerCommand('e', [Effect.Filters.isUser('fluxistence')],
			(user, level) => {
				this.broadcastEvent('epyh');
			}
		);
		this.registerCommand('s', [Effect.Filters.isUser('fluxistence')],
			(user, level) => {
				this.broadcastEvent('endHype');
			}
		);
		
		this.registerCommand('z', [Effect.Filters.isUser('fluxistence')],
			(username, volume) => {
				this.broadcastEvent('fxvol', { username, volume });
			}
		);
	}
}

module.exports = new ChannelParty();
