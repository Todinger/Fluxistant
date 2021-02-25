const DynamicArrayEntity = require('./dynamicArrayEntity');

class DynamicDataArrayEntity extends DynamicArrayEntity {
	static get TYPE()		{ return 'DynamicDataArray'; 							}
	static get BUILDER()	{ return value => new DynamicDataArrayEntity(value);	}
	
	constructor(colID, dataType) {
		super('Data', { colID, dataType });
	}
}

module.exports = DynamicDataArrayEntity;
