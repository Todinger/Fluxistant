const Globals = require('../globals');

class Builder {
	constructor(classes) {
		this.builders = {};
		Object.keys(classes).forEach(key => {
			this.builders[key] =
				(...params) => new classes[key](...params);
		});
	}
}

const FilterBuilder = new Builder({
	specificUser: require('./Filters/specificUserFilter'),
	oneOfUsers: require('./Filters/oneOfUsersFilter'),
	isMod: require('./Filters/isModFilter'),
	isSub: require('./Filters/isSubFilter'),
	and: require('./Filters/andFilter'),
	or: require('./Filters/orFilter'),
	not: require('./Filters/notFilter'),
});

function combineFilters(filters) {
	let filterObjects = [];
	if (filters) {
		filters.forEach(filter => {
			let filterObject = FilterBuilder.builders[filter.type](filter);
			filterObjects.push(filterObject);
		});
	}
	
	return FilterBuilder.builders.or({ filters: filterObjects });
}

const VariableBuilder = new Builder({
	custom: require('./Variables/functionVariable'),
	out: require('./Variables/outputVariable'),
});

const TriggerBuilder = new Builder({
	command: require('./Triggers/commandTrigger'),
	shortcut: require('./Triggers/shortcutTrigger'),
	keyDown: require('./Triggers/keyDownTrigger'),
	keyUp: require('./Triggers/keyUpTrigger'),
});

const ResponseBuilder = new Builder({
	console: require('./Responses/consoleResponse'),
	chat: require('./Responses/chatResponse'),
	se: require('./Responses/seResponse'),
});

let builders = {
	Filters: FilterBuilder.builders,
	Variables: VariableBuilder.builders,
	Triggers: TriggerBuilder.builders,
	Responses: ResponseBuilder.builders,
	
	combineFilters,
}

Globals.functionBuilders = builders;
module.exports = builders;
