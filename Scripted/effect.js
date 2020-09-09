var User = require('./user');
var TwitchManager = require('./twitchManager');

class Effect {
	constructor(description) {
		this.name = description.name;
		this.webname = description.webname;
		this.source = description.source;
		this.zindex = description.zindex;
		this.effectManager = null;
		
		this._clientAttachedHandlers = [];
		this._clientDisconnectedHandlers = [];
		this._connectedClients = {};
	}
	
	load() {
		// Do nothing by default (for overriding where needed)
	}
	
	postload() {
		// Do nothing by default (for overriding where needed)
	}
	
	registerCommand(cmdname, filters, callback) {
		TwitchManager.onCommand(cmdname, filters, callback);
	}
	
	attachClient(socket) {
		this._connectedClients[socket.id] = socket;
		socket.on('disconnect', () => {
			this._clientDisconnectedHandlers.forEach(handler => handler(socket));
			delete this._connectedClients[socket.id];
		});
		this._clientAttachedHandlers.forEach(handler => handler(socket));
	}
	
	_onClientAttached(handler) {
		this._clientAttachedHandlers.push(handler);
	}
	
	_onClientDisconnected(handler) {
		this._clientDisconnectedHandlers.push(handler);
	}
	
	_broadcastEvent(eventName, args) {
		Object.values(this._connectedClients).forEach(socket => {
			socket.emit(eventName, args);
		});
	}
	
	_onTwitchEvent(eventName, callback) {
		TwitchManager.on(eventName, callback);
	}
	
	static get Filters() {
		return User.Filters;
	}
}

module.exports = Effect;
