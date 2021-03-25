const ChoiceEntity = requireConfig('./choiceEntity');

class ObsFunctionDetailsEntity extends ChoiceEntity {
	static get TYPE()		{ return 'ObsFunctionDetails'; 					}
	static get GUITYPE()	{ return 'ExpandableChoice'; 				}
	static get BUILDER()	{ return () => new ObsFunctionDetailsEntity(); 	}
	
	constructor() {
		super();
		this._addOptions({
			["setCurrentScene"]:	'ObsFunctionDetails_SetCurrentScene',
		});
		
		this.select('setCurrentScene');
	}
}

module.exports = ObsFunctionDetailsEntity;
