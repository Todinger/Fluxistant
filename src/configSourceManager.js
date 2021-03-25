const assert = require('assert').strict;
const EventNotifier = require('./eventNotifier');

// Reserved event name for registering for any source changes
const ANY_EVENT_NAME = '<Any>';

class ConfigSourceManager extends EventNotifier {
	constructor() {
		super(true);
		this.sources = {};
	}
	
	getAllSources() {
		return this.sources;
	}
	
	getSourceOptions(source) {
		if (source in this.sources) {
			return this.sources[source];
		} else {
			return [];
		}
	}
	
	setSourceOptions(source, options) {
		this.sources[source] = options;
		this._notify(source, options);
		this._notify(ANY_EVENT_NAME, {
			source,
			options,
		});
	}
	
	onAny(callback) {
		super.on('<Any>', callback);
	}
	
	on(eventNames, callback) {
		if (Array.isArray(eventNames)) {
			assert(
				!eventNames.includes(ANY_EVENT_NAME),
				`Source name cannot be the reserved name "${ANY_EVENT_NAME}".`);
		} else {
			assert(
				eventNames !== ANY_EVENT_NAME,
				`Source name cannot be the reserved name "${ANY_EVENT_NAME}".`);
		}
		
		super.on(eventNames, callback);
	}
}

module.exports = new ConfigSourceManager();
