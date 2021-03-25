const Errors = requireMain('errors');

class ObsFunction {
	constructor(obsSocket) {
		this.obs = obsSocket;
	}
	
	invoke() {
		Errors.abstract();
	}
}

module.exports = ObsFunction;
