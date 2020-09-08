
class User {
	constructor(userstate) {
    	this.name = userstate.username;
    	this.displayName = userstate['display-name'];
    	this.isBroadcaster = userstate.badges.broadcaster == '1';
    	this.isMod = userstate['mod'];
    	this.isSub = userstate['subscriber'];
    	this.hasTurbo = userstate['turbo'];
    	this.badges = userstate['badges'];
    	this.color = userstate['color'];
    	this.userstate = userstate;
	}
	
}

// User filters
class Filters {
	static isMod() { return (user) => user.isMod; }
	static isAtLeastMod() { return (user) => user.isMod || user.isBroadcaster; }
	static isSub() { return (user) => user.isSub; }
	static isUser(username) { return (user) => user.name == username; }
}

module.exports = {
	User: User,
	Filters: Filters,
};
