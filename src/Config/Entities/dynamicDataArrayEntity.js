const DynamicArrayEntity = require('./dynamicArrayEntity');

class DynamicDataArrayEntity extends DynamicArrayEntity {
	static get TYPE()		{ return 'DynamicDataArray'; 							}
	static get BUILDER()	{ return value => new DynamicDataArrayEntity(value);	}
	
	constructor(collection, dataType) {
		super('Data', { collection, dataType });
	}
}

module.exports = DynamicDataArrayEntity;
