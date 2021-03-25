const ObsFunction = require('./ObsFunction');
const Utils = requireMain('./utils');

class SwitchToPreviousScene extends ObsFunction {
	constructor(obsControl, data) {
		super(obsControl, data);
	}
	
	invoke() {
		if (Utils.isNonEmptyString(this.obsControl.previousScene)) {
			return this.obs.send('SetCurrentScene', {
				['scene-name']: this.obsControl.previousScene,
			});
		} else {
			return Promise.resolve();
		}
	}
}

module.exports = SwitchToPreviousScene;
