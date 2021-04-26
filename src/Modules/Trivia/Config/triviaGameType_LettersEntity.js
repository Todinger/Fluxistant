const TriviaGame_BaseEntity = require('./triviaGameType_BaseEntity');

class TriviaGameType_LettersEntity extends TriviaGame_BaseEntity {
	static get TYPE()		{ return 'TriviaGameType_Letters'; 					}
	static get BUILDER()	{ return () => new TriviaGameType_LettersEntity(); 	}
	
	constructor(data) {
		super('Letters');
		this.setDescription('Shows letter blanks and reveals letters over time');
		this.addNaturalNumber('revealCount', data && data.revealCount || 3)
			.setName('Reveal Count')
			.setDescription('How many letters to reveal in total');
		this.addDuration('revealInterval', data && data.revealInterval || 15)
			.setName('Reveal Interval')
			.setDescription('How many seconds between letter revelations');
	}
	
	setData(data) {
		if (data) {
			if (data.revealCount) {
				this.getChild('revealCount').setValue(data.revealCount);
			}
			
			if (data.revealInterval) {
				this.getChild('revealInterval').setValue(data.revealInterval);
			}
		}
	}
}

module.exports = TriviaGameType_LettersEntity;
