const ChoiceEntity = require('././choiceEntity');

class TriviaGameTypeEntity extends ChoiceEntity {
	static get TYPE()		{ return 'TriviaGameType'; 					}
	static get BUILDER()	{ return () => new TriviaGameTypeEntity(); 	}
	
	constructor() {
		super();
		this._addOptions({
			["letters"]:		'TriviaGameType_Letters',
			["multipleChoice"]:	'TriviaGameType_MultipleChoice',
		});
		
		this.select('letters');
	}
}

module.exports = TriviaGameTypeEntity;
