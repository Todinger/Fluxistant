import EventNotifier from "/common/eventNotifier.mjs";

class SourceManager extends EventNotifier {
	constructor() {
		super();
		this.sources = {};
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
	}
	
	setSources(sources) {
		this.sources = sources;
		Object.keys(sources).forEach(source => this._notify(source));
	}
}

const sourceManager = new SourceManager();
export default sourceManager;
