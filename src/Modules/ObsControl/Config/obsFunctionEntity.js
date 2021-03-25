const FunctionEntity = requireConfig('Functions/functionEntity');
const ObsFunctionDetailsEntity = require('./obsFunctionDetailsEntity');

class ObsFunctionEntity extends FunctionEntity {
	static get TYPE()		{ return 'ObsFunction'; 					}
	static get BUILDER()	{ return () => new ObsFunctionEntity(); 	}
	
	constructor() {
		super();
		this.getChild('name').show();
		this.addChild('details', new ObsFunctionDetailsEntity())
			.setName('Details')
			.setDescription('Specific settings for this type of function');
	}
}

module.exports = ObsFunctionEntity;
