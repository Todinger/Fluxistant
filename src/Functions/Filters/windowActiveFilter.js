const FunctionFilter = require('./functionFilter');
const Process = requireMain('./process');
const Utils = requireMain('./utils');

class WindowActiveFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
		
		this.title = Utils.getDefaultProperty(settings, 'title');
	}
	
	get type() {
		return "windowActive";
	}
	
	test(context) {
		return this.title && Process.isWindowActive(this.title);
	}
}

module.exports = WindowActiveFilter;
