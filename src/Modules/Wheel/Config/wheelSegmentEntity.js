const StaticObjectEntity = requireConfig('./staticObjectEntity');

class WheelSegmentEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'WheelSegment';			        }
	static get GUITYPE()	{ return 'WheelSegment';		    	    }
	static get BUILDER()	{ return () => new WheelSegmentEntity(); 	}
	
	constructor() {
		super();
		this.addString('value')
			.setName('Value')
			.setDescription('This will be shown when picked by the wheel');
		this.addColor('color')
			.setName('Color')
			.setDescription('The color this wheel segment is on the wheel');
	}
	
	get valueEntity() {
		return this.getChild('value');
	}
	
	get colorEntity() {
		return this.getChild('color');
	}
}

module.exports = WheelSegmentEntity;
