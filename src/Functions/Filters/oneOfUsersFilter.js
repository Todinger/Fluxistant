const FunctionFilter = require('./functionFilter');

class OneOfUsersFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
		if (Array.isArray(settings)) {
			this._setUsernames(settings);
		} else {
			this._setUsernames(settings && settings.usernames);
		}
	}
	
	get type() {
		return "oneOfUsers";
	}
	
	_setUsernames(usernames) {
		if (usernames) {
			this.usernames = usernames.map(
				username => username.trim().toLowerCase());
		} else {
			this.usernames = [];
		}
	}
	
	test(context) {
		return this.usernames.includes(context.user.name);
	}
}

module.exports = OneOfUsersFilter;
