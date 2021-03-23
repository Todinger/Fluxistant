const FunctionFilter = require('./functionFilter');
const Process = requireMain('./process');
const Utils = requireMain('./utils');

class WindowRunningFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
		
		this.title = Utils.getDefaultProperty(settings, 'title');
	}
	
	get type() {
		return "windowRunning";
	}
	
	test(context) {
		return this.title && Process.isWindowRunning(this.title);
	}
}

module.exports = WindowRunningFilter;
