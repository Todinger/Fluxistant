const FilterEntity = require('./filterEntity');

class Filter_WindowActiveEntity extends FilterEntity {
	static get TYPE()		{ return 'Filter_WindowActive'; 							}
	static get BUILDER()	{ return (...p) => new Filter_WindowActiveEntity(...p); 	}
	
	constructor(data) {
		super('Window Active');
		this.setDescription('Only works when a window with the specified title is active (in focus, the foreground window)');
		this.addString('title')
			.setName('Window Title')
			.setDescription('The title of the window to check for (this is what shows up when you hover the mouse over the window in the Task Bar)');
		
		this.setData(data);
	}
	
	setData(data) {
		super.setData(data);
		if (data && data.title) {
			this.getChild('title').setValue(data.title);
		}
	}
}

module.exports = Filter_WindowActiveEntity;
