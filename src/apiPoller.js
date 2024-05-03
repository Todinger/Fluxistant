'use strict';
const assert = require('assert').strict;
const Utils = require('./utils');
const Errors = require('./errors');
const axios = require("axios");


class RequestEngine {
	async request(url, method) {
		Errors.abstract();
		return {};
	}
}


class AxiosRequestEngine extends RequestEngine {
	async request(url, method) {
		let response = await axios.request({
			url: url,
			method: method,
		});
		return response.data;
	}
}

AxiosRequestEngine.instance = new AxiosRequestEngine();



class MockRequestEngine extends RequestEngine {
	constructor() {
		super();
		this.response = {};
	}

	async request(url, method) {
		return this.response;
	}

	setResponse(response) {
		this.response = response;
	}
}


// Polls a given API URL at set intervals and triggers a callback on successful invocations
class ApiPoller {
	constructor(url, interval, callback, errorCallback, method = 'get', requestEngine) {
		this.url = url;
		this.method = method;
		this.interval = interval;
		this.callback = callback;
		this.errorCallback = errorCallback;
		this.requestEngine = requestEngine || AxiosRequestEngine.instance;

		this._timer = null;
	}

	_validateParameters() {
		assert(Utils.isNonEmptyString(this.url), `URL must be a nonempty string.`);
		assert(!isNaN(this.interval) && this.interval > 0, `Interval must be a positive number. Got: ${this.interval}`);
		assert(typeof this.callback === 'function', `Invalid callback for polling "${this.url}".`);
	}

	setURL(url) {
		assert(Utils.isNonEmptyString(url), `URL must be a nonempty string.`);
		this.url = url;
	}

	setInterval(interval) {
		assert(!isNaN(interval) && interval > 0, `Interval must be a positive number. Got: ${interval}`);
		if (interval !== this.interval) {
			this.stop();
			this.interval = interval;
			this.start();
		}
	}

	setRequestEngine(requestEngine) {
		this.requestEngine = requestEngine;
	}

	start() {
		if (this._timer !== null) return;
		this._validateParameters();
		this._onTick().then().catch();
		this._timer = setInterval(async () => await this._onTick(), this.interval);
	}

	stop() {
		if (this._timer === null) return;
		clearInterval(this._timer);
		this._timer = null;
	}

	async _onTick() {
		try {
			let data = await this.requestEngine.request(this.url, this.method);
			if (data) {
				this.callback(data);
			}
		} catch (err) {
			if (typeof this.errorCallback === 'function') {
				this.errorCallback(err);
			}
		}
	}
}

module.exports = {
	ApiPoller: ApiPoller,
	AxiosRequestEngine: AxiosRequestEngine,
	MockRequestEngine: MockRequestEngine,
};
