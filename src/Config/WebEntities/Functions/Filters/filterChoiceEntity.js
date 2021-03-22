const ChoiceEntity = require('../../choiceEntity');

class FilterChoiceEntity extends ChoiceEntity {
	static get TYPE()		{ return 'FilterChoice'; 					}
	static get GUITYPE()	{ return 'ExpandableChoice'; 				}
	static get BUILDER()	{ return () => new FilterChoiceEntity(); 	}
	
	constructor() {
		super();
		this._addOptions({
			["specificUser"]:	'Filter_SpecificUser',
			["oneOfUsers"]:		'Filter_OneOfUsers',
			["isMod"]:			'Filter_IsMod',
			["isSub"]:			'Filter_IsSub',
			["windowActive"]:	'Filter_WindowActive',
			["windowRunning"]:	'Filter_WindowRunning',
		});
	}
}

module.exports = FilterChoiceEntity;
