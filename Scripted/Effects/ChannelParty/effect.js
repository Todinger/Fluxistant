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
		this.registerCommand('a', [Effect.Filters.isUser('fluxistence')], user => {
			this._broadcastEvent('show', 'Channel Party');
		});
		this.registerCommand('b', [Effect.Filters.isUser('fluxistence')], user => {
			this._broadcastEvent('hide', 'Channel Party');
		});
	}
}

module.exports = new ChannelParty();
