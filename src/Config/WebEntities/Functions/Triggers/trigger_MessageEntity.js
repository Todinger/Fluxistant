const TriggerEntity = require('./triggerEntity');

class Trigger_MessageEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_Message'; 					}
	static get BUILDER()	{ return () => new Trigger_MessageEntity(); 	}
	
	constructor(data) {
		super('Message');
		this.setDescription('Activates this function via a messagee on the Twitch chat');
		this.addString('text', data && data.text || '')
			.setName('Text')
			.setDescription('The text that will invoke the function');
		this.addBoolean('exact', !!(data && data.exact)) // true if data.exact is set to true; false otherwise
			.setDescription('The text must match the message exactly, rather than show up anywhere.');
		this.addBoolean('regex', !!(data && data.regex)) // true if data.regex is set to true; false otherwise
			.setDescription('Specifies that the given text is a regular expression.');
		
		this.setData(data);
		
		this._defineChildrenOrder([
			'enabled',
			'text',
			'exact',
			'regex',
		]);
	}
	
	setData(data) {
		super.setData(data);
		if (data) {
			if (data.text) {
				this.getChild('text').setValue(data.text);
			}
			
			if (data.exact) {
				this.getChild('exact').setValue(data.exact);
			}
			
			if (data.regex) {
				this.getChild('regex').setValue(data.regex);
			}
		}
	}
}

module.exports = Trigger_MessageEntity;
