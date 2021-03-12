const DynamicArrayEntity = require('./dynamicArrayEntity');

class DynamicAssetArrayEntity extends DynamicArrayEntity {
	static get TYPE()		{ return 'DynamicDataArray'; 							}
	static get BUILDER()	{ return value => new DynamicAssetArrayEntity(value);	}
	
	constructor(collection, dataType) {
		super('SingleAsset', { collection, dataType });
	}
}

module.exports = DynamicAssetArrayEntity;
