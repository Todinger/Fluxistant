const Errors = requireMain('./errors');
const StaticObjectEntity = require('./staticObjectEntity');
const DynamicArrayEntity = require('./dynamicArrayEntity');
const StringEntity = require('./Values/stringEntity');
const NaturalNumberEntity = require('./Values/naturalNumberEntity');
const CooldownEntity = require('./cooldownEntity');
const UserFilter = require('./userFilterEntity');

class CommandEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Command'; 				    	}
	static get GUITYPE()	{ return 'Command'; 				    	}
	static get BUILDER()	{ return data => new CommandEntity(data); 	}
	c
	constructor(data) {
		super();
		this.addChild('cmdid', new StringEntity(data && data.cmdid || '')) // Identifies the command for functional purposes
			.hide();
		this.addChild('cmdname', new StringEntity(data && data.cmdname || ''))
			.setName('Name')
			.setDescription('The term that will invoke the command');
		this.addChild('aliases', new DynamicArrayEntity('String'))
			.setDescription('Optional additional names for the command');
		this.addChild('cost', new NaturalNumberEntity(data && data.cost || 0))
			.setDescription('Cost in StreamElements loyalty points');
		this.addChild('message', new StringEntity(data && data.message))
			.setDescription('A message the bot will send to the chat when the command is invoked');
		// this.addChild('silent', new ValueEntity(false))
		// 	.setDescription('Whether or not to suppress the bot from announcing point usage for this command.');
		this.addChild('cooldowns', new CooldownEntity())
			.setDescription('How long it takes before the command can be used again');
		this.addChild('filters', new DynamicArrayEntity('UserFilter'))
			.setName('User Filters')
			.setDescription('Specifies which users may use the command');
		
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
		super.validate();
		
		let cmdname = this.getCmdName();
		let cmdnameText = typeof cmdname === 'string' ? `"${cmdname}"` : `${cmdname}`;
		
		Errors.ensureRegexString(
			cmdname,
			/[^\s]+/,
			`Command name must be a non-empty single-word string. Got: ${cmdnameText}`);
		
		this.getAliases().forEach(
			alias => {
				if (alias) {
					Errors.ensureNonEmptyString(
						alias,
						'Command aliases must be non-empty strings.');
				}
			});
	}
	
	importDesc(descriptor, lenient) {
		super.importDesc(descriptor, lenient);
	}
}

module.exports = CommandEntity;
