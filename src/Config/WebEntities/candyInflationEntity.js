const ChoiceEntity = require('./choiceEntity');

class CandyInflationEntity extends ChoiceEntity {
	static get TYPE()		{ return 'CandyInflation';		    		}
	static get BUILDER()	{ return () => new CandyInflationEntity(); 	}
	
	constructor() {
		super();
		this._addOptions({
			["none"]:           'CandyInflation_None',
			["linear"]:         'CandyInflation_Linear',
			["exponential"]:    'CandyInflation_Exponential',
		});
		
		this.select('none');
	}
}

module.exports = CandyInflationEntity;
