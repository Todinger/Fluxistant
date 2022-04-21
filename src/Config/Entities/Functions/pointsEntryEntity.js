const UserEntity = require('../userEntity');

class PointsEntryEntity extends UserEntity {
	static get TYPE()		{ return 'PointsEntry';					}
	static get BUILDER()	{ return () => new PointsEntryEntity();	}

	constructor(data) {
		super(data);
		
		this.addInteger('amount', data && data.amount || 0)
			.setDescription('Amount of points to add (or remove, if negative)');
	}
}

module.exports = PointsEntryEntity;
