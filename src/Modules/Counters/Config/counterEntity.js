const NamedEntity = requireConfig('./namedEntity');

class CounterEntity extends NamedEntity {
	static get TYPE()		{ return 'Counter'; 					}
	static get BUILDER()	{ return () => new CounterEntity(); 	}
	
	constructor() {
		super();

		this.addString('name', '')
			.setName('Name')
			.setDescription('Counter name');

		this.add('incrementFunction', 'Function', {
			name: 'Increment Function',
			description: 'Increase the counter',
		});
	}

	getNameOverride() {
		return this.getChild('name').getValue();
	}
}

module.exports = CounterEntity;
