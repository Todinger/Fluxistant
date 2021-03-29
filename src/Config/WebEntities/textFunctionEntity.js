const FunctionEntity = require('./Functions/functionEntity');

class TextFunctionEntity extends FunctionEntity {
	static get TYPE()		{ return 'TextFunction'; 					}
	static get BUILDER()	{ return () => new TextFunctionEntity(); 	}
	
	constructor() {
		super();
		this.getChild('name').show();
	}
}

module.exports = TextFunctionEntity;
