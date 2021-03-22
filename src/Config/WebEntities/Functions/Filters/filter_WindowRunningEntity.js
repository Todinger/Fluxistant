const FilterEntity = require('./filterEntity');

class Filter_WindowRunningEntity extends FilterEntity {
	static get TYPE()		{ return 'Filter_WindowRunning'; 							}
	static get BUILDER()	{ return (...p) => new Filter_WindowRunningEntity(...p); 	}
	
	constructor(data) {
		super('Window Running');
		this.setDescription("Only works when a window with the specified title exists (even if it's in the background)");
		this.addString('title')
			.setName('Window Title')
			.setDescription('The title of the window to check for (this is what shows up when you hover the mouse over the window in the Task Bar)');
		
		this.setData(data);
	}
	
	setData(data) {
		if (data && data.title) {
			this.getChild('title').setValue(data.title);
		}
	}
}

module.exports = Filter_WindowRunningEntity;
