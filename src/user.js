// Represents a Twitch user.
// This object is constructed from a tmi.js userstate object, which doesn't
// always have all of the saved information and sometimes contains more which
// might be useful to some Modules (none at the time of writing though).
// For this reason the userstate object itself is also saved in the object.
class User {
	constructor(userstate) {
    	this.name			= userstate.username;
    	this.displayName	= userstate['display-name'];
    	this.isBroadcaster	= User.hasBadge(userstate, 'broadcaster');
    	this.isVIP			= User.hasBadge(userstate, 'vip');
    	this.isMod			= userstate.mod;
    	this.isSub			= userstate.subscriber;
    	this.hasTurbo		= userstate.turbo;
    	this.badges			= userstate.badges;
    	this.color			= userstate.color;
    	this.userstate		= userstate;
	}
	
	static hasBadge(userstate, badge) {
		return userstate.badges && userstate.badges[badge] === '1';
	}
	
	get isAtLeastMod() {
		return this.isMod || this.isBroadcaster;
	}
	
	static fromUsername(username) {
		return new User({
			username,
			['display-name']: username,
		});
	}
	
	static toUsername(text) {
		if (text) {
			text = text.trim().toLowerCase();
			if (text.startsWith('@')) {
				text = text.substr(1);
			}
			
			// Twitch usernames can't start with an underscore, can contain only
			// letters, numbers and underscores, and are between 3-25 characters
			// long (4-25 officially, but apparently some 3-letter Twitch usernames
			// were prizes for some Twitch contests/events in the past.
			// Sources:
			//   https://discuss.dev.twitch.tv/t/username-regex-for-api/1177
			//   https://discuss.dev.twitch.tv/t/twitch-channel-name-regex/3855/4
			//   https://stackoverflow.com/questions/35372320/youtube-and-twitch-channel-name-maximum-character-limit
			if (/^[a-zA-Z0-9][\w]{2,24}$/.test(text)) {
				return text;
			}
		}
		
		return undefined;
	}
}

function MakeBroadcasterUser(username) {
	let userstate = {
		username: username,
		// TODO: Get display name from Twitch (get entire UserState object if possible)
		['display-name']: username,
		badges: {
			broadcaster: '1',
		},
		subscriber: true,
	};
	
	return new User(userstate);
}

// User Filters:
// These are meant to be used in commands to specify who can use them.
// A Filter is any function that takes a User object and returns a boolean
// value. Returning true means that as far as the filter concerned the command
// can be used, returning false means the command cannot be used.
// Any filter returning false will disallow the usage altogether (usage rights
// are decided by performing an "and" operation between the results of all the
// filters).
// That said, a filter does not necessarily have to take and use the given User
// object. I've already added custom filters in certain Modules which disable
// the usage of their commands based on Module-specific conditions (for example,
// the !join command in the Candy Game Module has a filter that ignores the User
// object and returns its "active" state, thus making the command work only when
// the game is active).
// 
// Note that these functions here are not the Filters themselves.
// When invoked, they *return* the filter function.
class Filters {
	// Returns a filter that only accepts mods.
	static isMod() { return (user) => user.isMod; }
	
	// Returns a filter that only accepts mods and the broadacster.
	static isAtLeastMod() { return (user) => user.isAtLeastMod; }
	
	// Returns a filter that only accepts subscribers.
	static isSub() { return (user) => user.isSub; }
	
	// Returns a filter that only accepts the specified user
	static isUser(username) { return (user) => user.name === username; }
	
	// Returns a filter that only accepts one of the given users
	static isOneOf(usernames) { return (user) => usernames.includes(user.name); }
	
	// Given a filter name and array of arguments, returns the filter returned
	// from calling a function in this Filters class with the given name and
	// arguments.
	static fromData(name, args) {
		return Filters[name].apply(null, args);
	}
	
	// Given a filter name and a single argument, returns the filter returned
	// from calling a function in this Filters class with the given name and
	// providing the given argument.
	// This is a more specific version of the fromData function, but it's the
	// one we normally use since it's simpler and all of the functions here
	// take at most one argument (at the time of writing).
	static fromDataSingle(name, argument) {
		if (name in Filters) {
			return Filters[name](argument);
		} else {
			return undefined;
		}
	}
}

module.exports = {
	User,
	Filters,
	MakeBroadcasterUser,
};
