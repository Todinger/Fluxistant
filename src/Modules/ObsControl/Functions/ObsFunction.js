const Errors = requireMain('errors');

class ObsFunction {
	constructor(obsControl) {
		this.obsControl = obsControl;
		this.obs = obsControl.obs;
	}
	
	invoke() {
		Errors.abstract();
	}
}

module.exports = ObsFunction;
