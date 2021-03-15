const FunctionFilter = require('./functionFilter');

class SpecificUserFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
		if (typeof settings === 'string') {
			this._setUsername(settings);
		} else {
			this._setUsername(settings && settings.username);
		}
	}
	
	get type() {
		return "specificUser";
	}
	
	_setUsername(username) {
		if (username) {
			this.username = username.trim().toLowerCase();
		}
	}
	
	test(context) {
		return context.user.name === this.username;
	}
}

module.exports = SpecificUserFilter;
