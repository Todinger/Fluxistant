const ObsFunction = require('./ObsFunction');
const Utils = requireMain('./utils');

class SetCurrentScene extends ObsFunction {
	constructor(obsSocket, data) {
		super(obsSocket, data);
		this.sceneName = data && data.sceneName;
	}
	
	invoke() {
		if (Utils.isNonEmptyString(this.sceneName)) {
			return this.obs.send('SetCurrentScene', {
				['scene-name']: this.sceneName,
			});
		} else {
			return Promise.resolve();
		}
	}
}

module.exports = SetCurrentScene;
