const FunctionFilter = require('./functionFilter');
const Process = requireMain('./process');
const Utils = requireMain('./utils');

class WindowActiveFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
		
		this.process = null;
		this.title = Utils.getDefaultProperty(settings, 'title');
		if (this.title) {
			this.process = new Process(this.title);
		}
	}
	
	get type() {
		return "windowActive";
	}
	
	test(context) {
		return !this.process || this.process.isActive();
	}
}

module.exports = WindowActiveFilter;
