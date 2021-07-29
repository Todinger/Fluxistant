const NamedEntity = requireConfig('./namedEntity');

class NumberChoiceEntity extends NamedEntity {
	static get TYPE()		{ return 'NumberChoice'; 					}
	static get BUILDER()	{ return () => new NumberChoiceEntity(); 	}
	
	constructor() {
		super();
		
		this.addString('cmdname')
			.setName('Command')
			.setDescription('The command to activate the random roll');
		
		this.addInteger('minimum', 1)
			.setName('Minimum')
			.setDescription('The smallest number that can show up');
		this.addInteger('maximum', 6)
			.setName('Maximum')
			.setDescription('The largest number that can show up');
	}
	
	getCmdName() {
		return this.getChild('cmdname').getValue();
	}
	
	getNameOverride() {
		return this.getCmdName();
	}
}

module.exports = NumberChoiceEntity;
