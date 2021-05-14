const ObsFunction = require('./obsFunction');
const Utils = requireMain('./utils');

class SetSourceVisibility extends ObsFunction {
	constructor(obsSocket, data) {
		super(obsSocket, data);
		this.sourceName = data && data.sourceName;
		this.visibility = data !== undefined ? (data.visibility === true) : false;
	}
	
	invoke() {
		if (Utils.isNonEmptyString(this.sourceName)) {
			return this.obs.send('SetSourceVisibility', {
				['item']: this.sourceName,
				['visible']: this.visibility,
			});
		} else {
			return Promise.resolve();
		}
	}
}

module.exports = SetSourceVisibility;
