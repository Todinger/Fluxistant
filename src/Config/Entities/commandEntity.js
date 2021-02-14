const assert = require('assert').strict;
const Errors = requireMain('./errors');
const StaticObjectEntity = require('./staticObjectEntity');
const DynamicArrayEntity = require('./dynamicArrayEntity');
const StringEntity = require('./stringEntity');
const IntegerEntity = require('./integerEntity');
const CooldownEntity = require('./cooldownEntity');
const UserFilter = require('./userFilterEntity');

class CommandEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Command'; 				    	}
	static get GUITYPE()	{ return 'Command'; 				    	}
	static get BUILDER()	{ return data => new CommandEntity(data); 	}
	
	constructor(data) {
		super();
		this.addChild('cmdid', new StringEntity(data && data.cmdid || '')) // Identifies the command for functional purposes
			.hide();
		this.addChild('cmdname', new StringEntity(data && data.cmdname || ''))
			.setName('Name')
			.setDescription('The term that will invoke the command');
		this.addChild('aliases', new DynamicArrayEntity('String'))
			.setDescription('Optional additional names for the command');
		this.addChild('cost', new IntegerEntity(data && data.cost || 0))
			.setDescription('Cost in StreamElements loyalty points');
		this.addChild('message', new StringEntity(data && data.message))
			.setDescription('A message the bot will send to the chat when the command is invoked');
		// this.addChild('silent', new ValueEntity(false))
		// 	.setDescription('Whether or not to suppress the bot from announcing point usage for this command.');
		this.addChild('cooldowns', new CooldownEntity())
			.setDescription('How long it takes before the command can be used again');
		this.addChild('filters', new DynamicArrayEntity('UserFilter'))
			.setName('User Filters')
			.setDescription('Filters for which users may use the command');
		
		if (data) {
			if (data.name) {
				this.setName(data.name);
			}
			
			if (data.aliases) {
				data.aliases.forEach(alias => this.addAlias(alias));
			}
			
			if (data.cooldowns) {
				this.getCooldowns().set(data.cooldowns);
			}
			
			if (data.filters) {
				data.filters.forEach(filter => this.addUserFilter(filter));
			}
			
			if (data.description) {
				this.setDescription(data.description);
			}
		}
	}
	
	getCmdName() {
		return this.getChild('cmdname').getValue();
	}
	
	getAliases() {
		return this.getChild('aliases').map(e => e.getValue());
	}
	
	getCost() {
		return this.getChild('cost').getValue();
	}
	
	getCooldowns() {
		return this.getChild('cooldowns');
	}
	
	getUserFilters() {
		return this.getChild('filters').getElements();
	}
	
	addAlias(alias) {
		this.getChild('aliases').addElement(new StringEntity(alias));
	}
	
	addUserFilter(filter) {
		let filterEntity = this.getChild('filters').addElement(new UserFilter());
		let selectedFilter = filterEntity.select(filter.type);
		selectedFilter.setData(filter);
	}
	
	
	// ---- Overrides ---- //
	
	validate() {
		let cmdname = this.getCmdName();
		// Errors.ensureNonEmptyString(
		// 	this.getName(),
		// 	`Command name must be a non-empty string.`);
		Errors.ensureRegexString(
			cmdname,
			/[^\s]+/,
			`Command name must be a non-empty single-word string. Got: ${cmdname}`);
		
		this.getAliases().forEach(
			alias => Errors.ensureNonEmptyString(
				alias,
				'Command aliases must be non-empty strings.'));
		
		assert(
			this.getCost() >= 0,
			`Cost must be a non-negative integer (got: ${this.getCost()}).`);
	}
	
	importDesc(descriptor) {
		super.importDesc(descriptor);
	}
}

module.exports = CommandEntity;
