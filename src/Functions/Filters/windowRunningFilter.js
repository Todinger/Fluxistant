const FunctionFilter = require('./functionFilter');
const Process = requireMain('./process');
const Utils = requireMain('./utils');

class WindowRunningFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
		
		this.process = null;
		this.title = Utils.getDefaultProperty(settings, 'title');
		if (this.title) {
			this.process = new Process(this.title);
		}
	}
	
	get type() {
		return "windowRunning";
	}
	
	test(context) {
		return !this.process || this.process.isRunning();
	}
}

module.exports = WindowRunningFilter;
