const assert = require('assert').strict;
const Errors = requireMain('./errors');
const ObjectEntity = require('./objectEntity');
const ArrayEntity = require('./arrayEntity');
const ValueEntity = require('./valueEntity');
const CooldownEntity = require('./cooldownEntity');
const UserFilter = require('./userFilterEntity');

class CommandEntity extends ObjectEntity {
	static get TYPE()		{ return 'Command'; 					}
	static get BUILDER()	{ return () => new CommandEntity(); 	}
	
	constructor(data) {
		super(CommandEntity.TYPE, () => new CommandEntity());
		this.addChild('cmdname', new ValueEntity(data.cmdname || ''))
			.setName('Name')
			.setDescription('The term that will invoke the command.');
		this.addChild('aliases', new ArrayEntity('Value'))
			.setDescription('Optional additional names for the command.');
		this.addChild('cost', new ValueEntity(data.cost || 0))
			.setDescription('Cost in StreamElements loyalty points.');
		this.addChild('cooldowns', new CooldownEntity())
			.setDescription('How long it takes before the command can be used again.');
		this.addChild('filters', new ArrayEntity('UserFilter'))
			.setName('User Filters')
			.setDescription('Filters for which users may use the command.');
		
		if (data.aliases) {
			data.aliases.forEach(alias => this.addAlias(alias));
		}
		
		if (data.cooldowns) {
			this.getCooldowns().set(data.cooldowns);
		}
		
		if (data.filters) {
			data.filters.forEach(filter => this.addUserFilter(filter));
		}
	}
	
	getName() {
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
		this.getChild('aliases').addElement(new ValueEntity(alias));
	}
	
	addUserFilter(filter) {
		let filterEntity = this.getChild('filters').addElement(new UserFilter());
		filterEntity.select(filter.type);
		filterEntity.setData(filter);
	}
	
	// ---- Overrides ---- //
	
	validate() {
		let name = this.getName();
		// Errors.ensureNonEmptyString(
		// 	this.getName(),
		// 	`Command name must be a non-empty string.`);
		Errors.ensureRegexString(
			name,
			/[^\s]+/,
			`Command name must be a non-empty single-word string. Got: ${name}`);
		
		this.getAliases().forEach(
			alias => Errors.ensureNonEmptyString(
				alias,
				'Command aliases must be non-empty strings.'));
		
		assert(this.getCost() >= 0, 'Cost must be a non-negative integer');
	}
}

module.exports = CommandEntity;
