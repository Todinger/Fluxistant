const TriviaGame_BaseEntity = require('./triviaGameType_BaseEntity');

class TriviaGameType_MultipleChoiceEntity extends TriviaGame_BaseEntity {
	static get TYPE()		{ return 'TriviaGameType_MultipleChoice'; 					}
	static get BUILDER()	{ return () => new TriviaGameType_MultipleChoiceEntity(); 	}
	
	constructor() {
		super('Multiple Choice');
		this.setDescription('Shows a set of options to choose from');
	}
}

module.exports = TriviaGameType_MultipleChoiceEntity;
