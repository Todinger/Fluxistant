const FilterEntity = require('./filterEntity');
const EntityFactory = require('../../../entityFactory');

class Filter_OneOfUsersEntity extends FilterEntity {
	static get TYPE()		{ return 'Filter_OneOfUsers'; 							}
	static get BUILDER()	{ return (...p) => new Filter_OneOfUsersEntity(...p); 	}
	
	constructor(data) {
		super('One of Specific Users');
		this.setDescription('Allows usage by any user in the specified list');
		this.addDynamicArray('usernames', 'String', data && data.usernames)
			.setName('Usernames')
			.setDescription('Twitch usernames of the users who can use this');
		
		this.setData(data);
	}
	
	setData(data) {
		if (data && data.usernames) {
			let usernamesElement = this.getChild('usernames');
			data.usernames.forEach(username => {
				usernamesElement.addElement(
					EntityFactory.build('String', username));
			});
		}
	}
}

module.exports = Filter_OneOfUsersEntity;
