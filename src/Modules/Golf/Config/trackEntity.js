const NamedEntity = requireConfig('./namedEntity');

class TrackEntity extends NamedEntity {
	static get TYPE()		{ return 'Track'; 					}
	static get BUILDER()	{ return () => new TrackEntity(); 	}
	
	constructor() {
		super();
		
		this.addString('name', '')
			.setName('Name')
			.setDescription('Track name');
		this.addNonNegativeNumber('length', 0)
			.setName('Length')
			.setDescription('Length of the track (the distance to the hole)');
	}
	
	getNameOverride() {
		return this.getChild('name').getValue();
	}
}

module.exports = TrackEntity;
