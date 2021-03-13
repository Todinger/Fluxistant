const Function = require('./function');

class Builders {
	constructor(classes) {
		this.builders = {};
		Object.keys(classes).forEach(key => {
			this.builders[key] =
				(...params) => new classes[key](...params);
		});
	}
}



function func(funcDesc) {
	return new Function(funcDesc);
}

const VariableBuilder = new Builders({
	custom: require('./Variables/functionVariable'),
	out: require('./Variables/outputVariable'),
});

const TriggerBuilder = new Builders({
	command: require('./Triggers/commandTrigger'),
	shortcut: require('./Triggers/shortcutTrigger'),
});

const ResponseBuilder = new Builders({
	chat: require('./Responses/chatResponse'),
	console: require('./Responses/consoleResponse'),
});

// const AllBuilders = {};
//
// function _makeBuilders(classes) {
// 	let uniqueID = uuidv4();
// 	assert(
// 		!(uniqueID in AllBuilders),
// 		`Duplicate registration of supposedly-unique ID "${uniqueID}".`);
// 	AllBuilders[uniqueID] = new Builders(uniqueID, classes);
// 	return AllBuilders[uniqueID].builders;
// }
//
// function makeTriggerBuilders() {
// 	return _makeBuilders({
// 		command: CommandTrigger,
// 		shortcut: ShortcutTrigger,
// 	});
// }
//
// function makeResponseBuilders() {
// 	return _makeBuilders({
// 		chat: ChatResponse,
// 	});
// }

module.exports = {
	Func: func,
	Variables: VariableBuilder.builders,
	Triggers: TriggerBuilder.builders,
	Responses: ResponseBuilder.builders,
}
