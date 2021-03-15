const FunctionFilter = require('./functionFilter');

class SpecificUserFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
		this.username = settings.username;
	}
	
	get type() {
		return "specificUser";
	}
	
	test(context) {
		return context.user.name === this.username;
	}
}

module.exports = SpecificUserFilter;
