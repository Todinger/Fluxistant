const FunctionEntity = require('./Functions/functionEntity');

class RandomMediaFunctionEntity extends FunctionEntity {
	static get TYPE()		{ return 'RandomMediaFunction'; 					}
	static get BUILDER()	{ return () => new RandomMediaFunctionEntity(); 	}
	
	constructor() {
		super();
		this.getChild('name').show();
		this.add('mediaOptions', 'DynamicArray', 'SingleMedia')
			.setName('Media Options')
			.setDescription('One of these will be randomly selected to be shown/played');
	}
}

module.exports = RandomMediaFunctionEntity;
