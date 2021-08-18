let { PythonShell } = require('python-shell');

const EXTERNALS_PATH = '../external/';
function externalPath(filename) {
	return EXTERNALS_PATH + filename;
}

class Externals {
	constructor() {
		this.SoundPlayer = this._createPythonInstance('SoundPlayer.py', inst => ({
			play: (filePath, volume) => inst.send(`${volume} ${filePath}`),
		}));
	}
	
	_createPythonInstance(scriptName, functionGenerator) {
		return functionGenerator(new PythonShell(externalPath(scriptName)));
	}
}

module.exports = new Externals();
