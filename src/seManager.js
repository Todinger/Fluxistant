const io = require('socket.io-client');
const axios = require('axios');
// const Config = require('./botConfig.json');
const EventNotifier = require('./eventNotifier');
const cli = require('./cliManager');
const Utils = require('./utils');

const URL_BASE = 'https://api.streamelements.com/kappa/v2';
const URL_POINTS = URL_BASE + '/points';
const URL_BOT = URL_BASE + '/bot'
const SOCKET_URL = 'https://realtime.streamelements.com';

// Add the authorization token to every Axios request

// I started making a general request class here which I meant to fill with
// invocations of each method, but I ended up abandoning the idea halfway
// through.
// I'm leaving this here in case I decide to do this after all.
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

// Responsible for all interactions with StreamElements.
class SEManager extends EventNotifier {
	constructor() {
		super(true);
		
		// The data given in each of these events is the .data value supplied
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
			'subscriber',	// New subscription (possibly a recurring one, I
							// think)
			'tip',			// StreamElements tip
		]);
		
		// Used for event notifications
		this.socket = null;
		
		this._registerToCliEvents();
	}
	
	// Registers to commands given through the command-line interface
	_registerToCliEvents() {
		// Message simulation CLI commands
		cli.on(['se', 'semsg', 'semessage'], message => {
			// Pretend user, completely bogus, no such person ever existed
			this.say(message, null, (err) => cli.error(`[SE] ${err}`));
		});
	}
	
	_validParams(params) {
		return params && params.accountID && params.token;
	}
	
	_paramsAreTheSame(params) {
		return this.params.accountID === params.accountID &&
			this.params.token === params.token;
	}
	
	updatePointNames(params) {
		// Name of the StreamElements loyalty points (this might be obtainable
		// through StreamElements but I didn't bother doing that as it's a
		// pretty static thing)
		this.POINTS_NAME =
			Utils.isNonEmptyString(params.pointsName) ?
				params.pointsName :
				'points';
		this.POINTS_NAME_SINGULAR =
			Utils.isNonEmptyString(params.pointsNameSingular) ?
				params.pointsNameSingular
				: 'point';
		
		if (!this.params) {
			this.params = {};
		}
		
		this.params.pointsName = params.pointsName;
		this.params.pointsNameSingular = params.pointsNameSingular;
	}
	
	connect(params) {
		this.updatePointNames(params);
		
		if (!this._validParams(params)) {
			this.disconnect();
			return;
		} else if (this.params && this._paramsAreTheSame(params)) {
			// If we're already connected to the requested channel, do nothing
			return;
		}
		
		if (!this.params) {
			this.params = {};
		}
		
		this.params.accountID = params.accountID;
		this.params.token = params.token;
		
		this.socket = io(SOCKET_URL, {
			transports: ['websocket'],
		});
		
		axios.defaults.headers.common['Authorization'] = `Bearer ${params.token}`;
		
		this.socket.on('connect', () => this._onConnected());
		this.socket.on('disconnect', () => this._onDisconnected());
		this.socket.on('authenticated', (data) => this._onAuthenticated(data));
		this.socket.on('event', (data) => this._onEvent(data));
		this.socket.on('event:message', (data) => this._onEvent(data));
		
		this.connected = false;
	}
	
	disconnect() {
		if (this.socket) {
			this.connected = false;
			this.socket.close();
			this.socket = null;
			axios.defaults.headers.common['Authorization'] = '';
		}
	}
	
	// Called when we've established an initial connection to SE.
	_onConnected() {
		this.connected = true;
		cli.log('[SE] Connected to StreamElements.');
		this.socket.emit('authenticate', {
			method: 'jwt',
			token: this.params.token,
		});
	}
	
	// Called when we've been disconnected.
	_onDisconnected() {
		cli.log('[SE] Disconnected from StreamElements.');
		this.connected = false;
	}
	
	// After connecting we attempt authentication.
	// This method is called once that's done.
	// We can start working with the SE socket as soon as this is called.
	_onAuthenticated() {
		cli.log(`[SE] Successfully connected via StreamElements to channel.`);
	}
	
	// Called every time an event is received from StreamElements via the
	// websocket.
	// See here for details about the events:
	//   https://github.com/StreamElements/widgets/blob/master/CustomCode.md#on-event
	// BUT!
	// Keep in mind that the above page is documentation for StreamElements
	// widget development (to be used in their overlays), and it differs a
	// little from the websocket.
	// For example, it lists a "message" event which occurs when someone sends
	// a message to the Twitch chat. While that should work in widgets, here we
	// will not be receiving this event at all.
	// Furthermore, the documentation about websocket connections found here:
	//   https://docs.streamelements.com/docs/connecting-via-websocket-using-oauth2
	// is a bit out dated.
	// The JSON section that shows the schema is inaccurate.
	// See the file StreamElements.websocket.schema.json for a more accurate
	// version (well, all I did was fix the parts about store redemptions; I
	// don't know if the rest is correct or not).
	_onEvent(details) {
		if (details) {
			this._notify(details.type, details.data);
		}
	}
	
	// Gets the amount of loyalty points the given user has.
	// This uses the StreamElements API, so not a part of the socket
	// communications at all.
	// 
	// Parameters:
	// 	username	Twitch username for the user we want to look into.
	// 	onDone		Will be invoked when the request has finished successfully.
	// 				Should accept a single argument with the amount of points.
	// 	onError		Will be invoked if something goes wrong with the request.
	// 				Should accept a single argument with error details, I think.
	getUserPoints(username, onDone, onError) {
		if (!this.connected) {
			onError('Not connected to StreamElements.');
			return;
		}
		
		let requestURL = `${URL_POINTS}/${this.params.accountID}/${username}`;
		let promise = axios.get(requestURL);
		if (onDone) {
			promise = promise.then(response => onDone(response.data.points));
		}
		
		if (onError) {
			promise = promise.catch(onError);
		}
	}
	
	// Adds loyalty points the given user has.
	// Well, I say "adds", but if you put a negative number then they will be
	// decreased.
	// This uses the StreamElements API, so not a part of the socket
	// communications at all.
	// 
	// Parameters:
	// 	username	Twitch username for the user we want to look into.
	// 	onDone		Will be invoked when the request has finished successfully.
	// 				Should accept a single argument with the amount of points.
	// 	onError		Will be invoked if something goes wrong with the request.
	// 				Should accept a single argument with error details, I think.
	addUserPoints(username, amount, onDone, onError) {
		if (!this.connected) {
			onError('Not connected to StreamElements.');
			return;
		}
		
		let requestURL =
			`${URL_POINTS}/${this.params.accountID}/${username}/${amount}`;
		let promise = axios.put(requestURL);
		if (onDone) {
			promise = promise.then(response => onDone(response.data.newAmount));
		}
		
		if (onError) {
			promise = promise.catch(onError);
		}
	}
	
	// Same as addUserPoints, only subtracts the amount.
	// If you put a negative number here, it will add points.
	// Just a negative version of addUserPoints, really.
	subtractUserPoints(username, amount, onDone, onError) {
		this.addUserPoints(username, -amount, onDone, onError);
	}
	
	// Attempts to deduct the given amount of points from the user, and if
	// successful, calls the onDone function to indicate success.
	// The idea is that when you want to do something that should cost a user a
	// certain amount of points, you invoke this function and perform your
	// action when the onDone function is invoked, and deal with what you want
	// do if the user doesn't have enough points when the onInsufficientPoints
	// function is invoked.
	// 
	// onDone should take two arguments: (oldAmount, newAmount), which
	// represent the amount of points the user had before and after the
	// operation respectively.
	// onInsufficientPoints should take two arguments: (amount, points), where
	// 'amount' is the amount of points we tried to consume and 'points' is the
	// amount of points the user actually had.
	// 
	// Parameters:
	// 	username				Twitch username whose points we want to consume.
	// 	amount					How many points to consume.
	// 	onDone					What to do upon success. The points are deducted
	// 							by the time this is called.
	// 	onInsufficientPoints	What to do when the user doesn't have enough
	// 							points for whatever it is we're trying to do.
	// 	onError					Called if something goes wrong that isn't the
	// 							user not having enough points.
	consumeUserPoints(username, amount, onDone, onInsufficientPoints, onError) {
		if (!this.connected) {
			onError('Not connected to StreamElements.');
			return;
		}
		
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
	
	// Returns a string specifying the given amount of points along with
	// the name of the user points.
	// Also adjusts for singular when the quantity is 1 or -1.
	pointsString(points) {
		let name =
			Math.abs(points) === 1 ?
				this.POINTS_NAME_SINGULAR :
				this.POINTS_NAME;
		return `${points} ${name}`;
	}
	
	// Makes the StreamElements bot say something in our channel.
	// 
	// Parameters:
	// 	msg			The message that the bot should send.
	// 	onDone		Called once the message has been successfully sent.
	// 	onError		Called if something goes wrong with the request.
	say(msg, onDone, onError) {
		if (!this.connected) {
			onError('Not connected to StreamElements.');
			return;
		}
		
		let requestURL =
			`${URL_BOT}/${this.params.accountID}/say`;
		
		let promise = axios.post(requestURL, { message: msg });
		
		if (onDone) {
			promise = promise.then(onDone);
		}
		
		if (onError) {
			promise = promise.catch(onError);
		}
	}
}

module.exports = new SEManager();
