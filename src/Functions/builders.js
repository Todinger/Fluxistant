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
	isMod: require('./Filters/isModFilter'),
	isSub: require('./Filters/isSubFilter'),
	and: require('./Filters/andFilter'),
	or: require('./Filters/orFilter'),
	not: require('./Filters/notFilter'),
});

const VariableBuilder = new Builder({
	custom: require('./Variables/functionVariable'),
	out: require('./Variables/outputVariable'),
});

const TriggerBuilder = new Builder({
	command: require('./Triggers/commandTrigger'),
	shortcut: require('./Triggers/shortcutTrigger'),
});

const ResponseBuilder = new Builder({
	chat: require('./Responses/chatResponse'),
	console: require('./Responses/consoleResponse'),
});

module.exports = {
	Filters: FilterBuilder.builders,
	Variables: VariableBuilder.builders,
	Triggers: TriggerBuilder.builders,
	Responses: ResponseBuilder.builders,
}
