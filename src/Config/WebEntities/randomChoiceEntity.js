const NamedEntity = require('././namedEntity');

class RandomChoiceEntity extends NamedEntity {
	static get TYPE()		{ return 'RandomChoice'; 					}
	static get BUILDER()	{ return () => new RandomChoiceEntity(); 	}
	
	constructor() {
		super();
		
		this.addString('cmdname')
			.setName('Command')
			.setDescription('The command to activate the random roll');
		
		this.addDynamicArray('choices', 'String')
			.setName('Choices')
			.setDescription('The values that can be randomly chosen');
	}
	
	getCmdName() {
		return this.getChild('cmdname').getValue();
	}
	
	getNameOverride() {
		return this.getCmdName();
	}
}

module.exports = RandomChoiceEntity;
