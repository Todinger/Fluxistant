const StaticObjectEntity = requireConfig('staticObjectEntity');

class CounterEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Counter'; 					}
	static get BUILDER()	{ return () => new CounterEntity(); 	}
	
	constructor() {
		super();
		this.getChild('name').show();
		
		let funcs = this.addGroup('functions')
			.setName("Functions")
			.setDescription("All the things that can be done with this counter");
		
		
	}
}

module.exports = CounterEntity;
