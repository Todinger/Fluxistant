const assert = require('assert').strict;
const _ = require('lodash');
const Utils = require('./utils');

const SECONDS = 1;
const MINUTES = 60 * SECONDS;

const USER_SECONDS = 1000;

const COOLDOWN_CLEANUP_INTERVAL = 30 * MINUTES;

class CooldownManager {
	constructor() {
		this._cooldownData = {};		// Information we need to support cooldowns
		this._cooldownDefs = {};
		this.nextCooldownID = 0;
		
		// Start a recurring cleanup process to get rid of old cooldown data
		setInterval(() => this._cleanupCooldowns(), COOLDOWN_CLEANUP_INTERVAL);
	}
	
	_verifyPresence(cooldownID) {
		assert(
			cooldownID in this._cooldownDefs,
			`Unknown cooldown ID: ${cooldownID}`);
	}
	
	addCooldown(cooldownDef) {
		cooldownDef = cooldownDef || {};
		let id = this.nextCooldownID++;
		this._cooldownDefs[id] = Utils.clone(cooldownDef);
		this._cooldownData[id] = {};
		return id;
	}
	
	changeCooldown(cooldownID, cooldownDef) {
		this._verifyPresence(cooldownID);
		
		this._cooldownDefs[cooldownID] = cooldownDef || {};
	}
	
	removeCooldown(cooldownID) {
		this._verifyPresence(cooldownID);
		
		delete this._cooldownData[cooldownID];
		delete this._cooldownDefs[cooldownID];
	}
	
	// Returns true iff the user is currently allowed to use the command at the
	// moment.
	//
	// Parameters:
	// 	user		User object of the user who invoked the command.
	// 	handler		A full description of the command as it was registered (see
	// 				registerCommand for the full details on this object).
	checkCooldowns(cooldownID, user) {
		this._verifyPresence(cooldownID);
		
		let cdd = this._cooldownData[cooldownID];
		let now = Utils.now();
		
		// If cdd is undefined then there's no cooldown data yet,
		// so it hasn't been used and thus it's not on cooldown
		if (cdd) {
			if (cdd.global && (now < cdd.global)) {
				// This command is still on a global cooldown right now
				return false;
			}
			
			if (cdd.users &&
				cdd.users[user.name] &&
				now < cdd.users[user.name]) {
				// This user is still on cooldown for this command
				return false;
			}
		}
		
		return true;
	}
	
	resetCooldowns(cooldownID) {
		this._verifyPresence(cooldownID);
		
		this._cooldownData[cooldownID] = {};
	}
	
	// Applies cooldowns for the command (should only be used after the command
	// has successfully been invoked).
	// The way we implement this is by saving the next time a command may be
	// used and comparing the current time with it when we wish to determine
	// whether it can be used at any point.
	//
	// Parameters:
	// 	user		User object of the user who invoked the command.
	// 	handler		A full description of the command as it was registered (see
	// 				registerCommand for the full details on this object).
	applyCooldowns(cooldownID, user) {
		this._verifyPresence(cooldownID);
		
		// We save current cooldown information (global and per user) in
		// this._cooldownData with keys being the command's unique ID - if
		// there is no information here yet, this is where we create it
		let cooldownData = this._cooldownData[cooldownID] || {};
		let cooldownDef = this._cooldownDefs[cooldownID];
		
		// This means there are user-specific cooldowns
		if (cooldownDef.user) {
			// Make sure that we have where to store the data for the
			// current user
			if (!cooldownData.users) {
				cooldownData.users = {};
			}
			
			// Specify that the given user may not use this command until
			// handler.cooldowns.user milliseconds have passed
			cooldownData.users[user.name] =
				Utils.now() + cooldownDef.user * USER_SECONDS;
		}
		
		// This means there is a global cooldown - that is, when someone
		// invokes the command, no-one else may invoke it until this
		// cooldown period is over
		if (cooldownDef.global) {
			// Specify that no user may use this command until
			// handler.cooldowns.global milliseconds have passed
			cooldownData.global = Utils.now() + cooldownDef.global * USER_SECONDS;
		}
		
		// Save the information we just created/updated
		this._cooldownData[cooldownID] = cooldownData;
	}
	
	// Removes expired cooldowns periodically.
	// This function goes over all the information in this._cooldownData and
	// deletes any entry it finds which points to a time in the past, as that
	// means that it is no longer relevant.
	//
	// When we delete something, it is possible that the object that contained
	// it is left empty. We test for this and remove the entire object if so.
	_cleanupCooldowns() {
		let now = Utils.now();
		
		Object.keys(this._cooldownData).forEach(id => {
			let cdd = this._cooldownData[id];
			
			if (cdd.users) {
				Object.keys(cdd.users).forEach(username => {
					if (cdd.users[username] < now) {
						delete cdd.users[username];
					}
				});
				
				if (_.isEmpty(cdd.users)) {
					delete cdd.users;
				}
			}
			
			if (cdd.global) {
				if (cdd.global < now) {
					delete cdd.global;
				}
			}
			
			if (_.isEmpty(cdd)) {
				delete this._cooldownData[id];
			}
		});
	}
}

module.exports = new CooldownManager();
