const ChoiceEntity = require('../../choiceEntity');

class FilterChoiceEntity extends ChoiceEntity {
	static get TYPE()		{ return 'FilterChoice'; 					}
	static get GUITYPE()	{ return 'ExpandableChoice'; 				}
	static get BUILDER()	{ return () => new FilterChoiceEntity(); 	}
	
	constructor() {
		super();
		this._addOptions({
			["specificUser"]:	'Filter_SpecificUser',
			["isMod"]:			'Filter_IsMod',
			["isSub"]:			'Filter_IsSub',
		});
	}
}

module.exports = FilterChoiceEntity;
