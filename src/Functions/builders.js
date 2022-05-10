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
	specificUser:	require('./Filters/specificUserFilter'),
	oneOfUsers:		require('./Filters/oneOfUsersFilter'),
	isMod:			require('./Filters/isModFilter'),
	isSub:			require('./Filters/isSubFilter'),
	isVIP:			require('./Filters/isVIPFilter'),
	isBroadcaster:	require('./Filters/isBroadcasterFilter'),
	and:			require('./Filters/andFilter'),
	or:				require('./Filters/orFilter'),
	not:			require('./Filters/notFilter'),
	windowActive:	require('./Filters/windowActiveFilter'),
	windowRunning:	require('./Filters/windowRunningFilter'),
});

const VariableBuilder = new Builder({
	custom:	require('./Variables/functionVariable'),
	out:	require('./Variables/outputVariable'),
	getter:	require('./Variables/getterVariable'),
});

const TriggerBuilder = new Builder({
	command:			require('./Triggers/commandTrigger'),
	message:			require('./Triggers/messageTrigger'),
	shortcut:			require('./Triggers/shortcutTrigger'),
	keyDown:			require('./Triggers/keyDownTrigger'),
	keyUp:				require('./Triggers/keyUpTrigger'),
	reward:				require('./Triggers/channelRewardTrigger'),
	windowActivated:	require('./Triggers/windowActivatedTrigger'),
	windowDeactivated:	require('./Triggers/windowDeactivatedTrigger'),
	windowStarted:		require('./Triggers/windowStartedTrigger'),
	windowExited:		require('./Triggers/windowExitedTrigger'),
	host:       		require('./Triggers/hostTrigger'),
	raid:       		require('./Triggers/raidTrigger'),
	time:       		require('./Triggers/timeTrigger'),
});

const ResponseBuilder = new Builder({
	console:	    require('./Responses/consoleResponse'),
	chat:		    require('./Responses/chatResponse'),
	streamerChat:	require('./Responses/streamerChatResponse'),
	se:			    require('./Responses/seResponse'),
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

let builders = {
	Filters:	FilterBuilder.builders,
	Variables:	VariableBuilder.builders,
	Triggers:	TriggerBuilder.builders,
	Responses:	ResponseBuilder.builders,
	
	combineFilters,
}

Globals.functionBuilders = builders;
module.exports = builders;
