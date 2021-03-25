const assert = require('assert').strict;

class ObsFunctionFactory {
	constructor() {
		this.classes = {
			setCurrentScene: require('./setCurrentScene'),
		};
	}
	
	build(type, obsSocket, data) {
		assert(
			type in this.classes,
			`Unknown OBS Function type: ${type}`);
		
		return new this.classes[type](obsSocket, data);
	}
}

module.exports = new ObsFunctionFactory();
