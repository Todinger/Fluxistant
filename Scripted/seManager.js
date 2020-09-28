const assert = require('assert').strict;
const io = require('socket.io-client');
const axios = require('axios');
const Config = require('./botConfig.json');
const EventNotifier = require('./eventNotifier');

const URL_BASE = 'https://api.streamelements.com/kappa/v2';
const URL_POINTS = URL_BASE + '/points';
const SOCKET_URL = 'https://realtime.streamelements.com';

// Add the authorization token to every Axios request.
axios.defaults.headers.common['Authorization'] = `Bearer ${Config.token}`;

/*
//Sets User points
async function setUserPoints(user, channelID, amount) {
  try {
    const userAPI = `https://api.streamelements.com/kappa/v2/points/${channelID}/${user}/${amount}`;
    const response = await axios.put(userAPI);
    console.log('API Response:', response.data);
  } catch (error) {
    console.log(`Set user points error: ${error}.`);
  }
}
*/
/*
class Request {
	static get GET() { return 'GET'; }
	static get PUT() { return 'PUT'; }
	static get DELETE() { return 'DELETE'; }
	
	constructor() {
		this.method = null;
		this.value = null;
		this.parameter = null;
		this.username = null;
	}
	
	get() {
		this.method = Request.GET;
		this.value = null;
		return this;
	}
	
	points() {
		this.parameter = 'points';
		return this;
	}
	
	user(username) {
		this.username = username;
	}
	
	isValid() {
		return
			this.category &&
			this.method &&
			(this.method == Request.PUT ? this.value != null : true);
	}
	
	toString() {
		if (!isValid()) {
			return '<Invalid requst>';
		}
		
		let requestString =
			`${URL_BASE}/${this.category}/${Config.channel}/${this.username}`;
		
		switch (this.method) {
			case Request.GET:
				
		}
	}
}
*/

class SEManager extends EventNotifier {
	constructor() {
		super();
		
		// The data given in each of these eventns is the .data value supplied
		// in the event message from StreamElements
		// See StreamElements.websocket.schema.json for a description of
		// the details object received in each request (its .data property
		// is the one mentioned above)
		this._addEvents([
			'cheer',		// User cheered (with bits)
			'follow',		// New follower in the stream
			'host',			// Hosted by someone
			'raid',			// Raided by someone
			'redemption',	// Store redemption (costs SE loyalty points)
			'subscriber',	// New subscription (possibly a recurring one, I think)
			'tip',			// StreamElements tip
		]);
		
		this.POINTS_NAME = Config.pointsName;
		this.socket = null;
	}
	
	init() {
		this.socket = io(SOCKET_URL, {
			transports: ['websocket'],
		});
		
		this.socket.on('connect', () => this._onConnected());
		this.socket.on('disconnect', () => this._onDisconnected());
		this.socket.on('authenticated', (data) => this._onAuthenticated(data));
		this.socket.on('event', (data) => this._onEvent(data));
		this.socket.on('event:message', (data) => this._onEvent(data));
	}
	
	_onConnected() {
		console.log('Connected to StreamElements');
		this.socket.emit('authenticate', {
			method: 'jwt',
			token: Config.token,
		});
	}
	
	_onDisconnected() {
		console.log('Disconnected from StreamElements');
	}
	
	_onAuthenticated(data) {
		const {
			channelId
		} = data;
		
		console.log(
			`Successfully connected via StreamElements to channel ${channelId}`);
	}
	
	_onEvent(details) {
		if (details) {
			this._notify(details.type, details.data);
		}
	}
	
	
	
	getUserPoints(username, onDone, onError) {
		let requestURL = `${URL_POINTS}/${Config.channelID}/${username}`;
		let promise = axios.get(requestURL);
		if (onDone) {
			promise = promise.then(response => onDone(response.data.points));
		}
		
		if (onError) {
			promise = promise.catch(onError);
		}
	}
	
	addUserPoints(username, amount, onDone, onError) {
		let requestURL =
			`${URL_POINTS}/${Config.channelID}/${username}/${amount}`;
		let promise = axios.put(requestURL);
		if (onDone) {
			promise = promise.then(response => onDone(response.data.newAmount));
		}
		
		if (onError) {
			promise = promise.catch(onError);
		}
	}
	
	subtractUserPoints(username, amount, onDone, onError) {
		this.addUserPoints(username, -amount, onDone, onError);
	}
	
	// onDone should take two arguments: (oldAmount, newAmount), which
	// represent the amount of points the user had before and after the
	// operation respectively
	// onInsufficientPoints should take two arguments: (amount, points), where
	// 'amount' is the amount of points we tried to consume and 'points' is the
	// amount of points the user actually had
	consumeUserPoints(username, amount, onDone, onInsufficientPoints, onError) {
		this.getUserPoints(
			username,
			points => {
				if (points < amount) {
					onInsufficientPoints(amount, points);
				} else {
					this.subtractUserPoints(
						username,
						amount,
						newPoints => onDone(points, newPoints),
						onError);
				}
			},
			onError);
	}
}

module.exports = new SEManager();
