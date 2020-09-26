const assert = require('assert').strict;
const axios = require('axios');
const Config = require('./botConfig.json');

const URL_BASE = 'https://api.streamelements.com/kappa/v2';
const URL_POINTS = URL_BASE + '/points';

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

class SEManager {
	constructor() {
		this.requestQueues = {
			points: [],
		};
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
					this.subtractUserPoints(username, amount, onDone, onError);
				}
			},
			onError);
	}
}

module.exports = new SEManager();
