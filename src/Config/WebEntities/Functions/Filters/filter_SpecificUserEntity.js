const FilterEntity = require('./filterEntity');

class Filter_SpecificUserEntity extends FilterEntity {
	static get TYPE()		{ return 'Filter_SpecificUser'; 							}
	static get BUILDER()	{ return (...p) => new Filter_SpecificUserEntity(...p); 	}
	
	constructor(data) {
		super('Specific User');
		this.setDescription('Allows usage by a specific user');
		this.addString('username')
			.setName('Username')
			.setDescription('Twitch username of the user who can use this');
		
		this.setData(data);
	}
	
	setData(data) {
		if (data && data.username) {
			this.getChild('username').setValue(data.username);
		}
	}
}

module.exports = Filter_SpecificUserEntity;
