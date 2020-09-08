var User = require('./user');
var TwitchManager = require('./twitchManager');

class Effect {
	constructor(description) {
		this.name = description.name;
		this.webname = description.webname;
		this.source = description.source;
		this.zindex = description.zindex;
		
		this._clientConnectedHandlers = [];
		this._clientDisconnectedHandlers = [];
		this._connectedClients = {};
	}
	
	load() {
		throw "Abstract effect loaded.";
	}
	
	registerCommand(cmdname, filters, callback) {
		TwitchManager.onCommand(cmdname, filters, callback);
	}
	
	clientConnected(socket) {
		this._connectedClients[socket.id] = socket;
		socket.on('disconnect', () => {
			this._clientDisconnectedHandlers.forEach(handler => handler(socket));
			delete this._connectedClients[socket.id];
		});
		this._clientConnectedHandlers.forEach(handler => handler(socket));
	}
	
	_onClientConnected(handler) {
		this._clientConnectedHandlers.push(handler);
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
