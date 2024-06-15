const ChoiceEntity = require('../../choiceEntity');


const ALL_FILTERS = {
	["specificUser"]:	'Filter_SpecificUser',
	["oneOfUsers"]:		'Filter_OneOfUsers',
	["isMod"]:			'Filter_IsMod',
	["isSub"]:			'Filter_IsSub',
	["isVIP"]:			'Filter_IsVIP',
	["isBroadcaster"]:	'Filter_IsBroadcaster',
	["windowActive"]:	'Filter_WindowActive',
	["windowRunning"]:	'Filter_WindowRunning',
	["skinIsDiamond"]:	'Filter_SkinIsDiamond',
	["skinIsEpic"]:		'Filter_SkinIsEpic',
	["skinIsFlag"]:		'Filter_SkinIsFlag',
	["skinIsFull"]:		'Filter_SkinIsFull',
	["skinIsGold"]:		'Filter_SkinIsGold',
	["skinIsHead"]:		'Filter_SkinIsHead',
	["skinIsHolo"]:		'Filter_SkinIsHolo',
	["skinIsVariant"]:	'Filter_SkinIsVariant',
}

const DEFAULT_FILTER_NAMES = [
	"specificUser",
	"oneOfUsers",
	"isMod",
	"isSub",
	"isVIP",
	"isBroadcaster",
	"windowActive",
	"windowRunning",
];

function selectFilters(filterNames) {
	let result = {};
	for (let name of filterNames) {
		result[name] = ALL_FILTERS[name];
	}

	return result;
}


const DEFAULT_FILTERS = selectFilters(DEFAULT_FILTER_NAMES);


class FilterChoiceEntity extends ChoiceEntity {
	static get TYPE()		{ return 'FilterChoice'; 							}
	static get GUITYPE()	{ return 'ExpandableChoice'; 						}
	static get BUILDER()	{ return (...p) => new FilterChoiceEntity(...p); 	}
	
	constructor(allowedFilters) {
		super();
		this._addOptions(allowedFilters ? selectFilters(allowedFilters) : DEFAULT_FILTERS);
	}
}

module.exports = FilterChoiceEntity;
