const fs = require('fs');
const path = require('path');
const safeWriteFile = require('crash-safe-write-file').writeFile;
const cli = require('./cliManager');
const Utils = require ('./utils');

class PersistentData {
	constructor(filename) {
		this.filename = filename;
		this.data = {};
	}
	
	set(name, value) {
		this.data[name] = value;
		this.save();
	}

	setAll(data) {
		this.data = data;
	}
	
	get(name) {
		if (name === undefined) {
			return this.data;
		} else {
			return this.data[name];
		}
	}

	save() {
		Utils.ensureDirExists(path.dirname(this.filename));
		safeWriteFile(this.filename, JSON.stringify(this.data, null, '\t'), (err) => {
			if (err) {
				cli.error(`Error writing persistent data to ${this.filename}: ${Utils.errMessage(err)}`);
			} else {
				cli.log(`[PersistentData] Data saved to: ${this.filename}`);
			}
		});
	}
	
	load(defaultValue) {
		try {
			let savedData = fs.readFileSync(this.filename);
			this.data = JSON.parse(savedData);
		} catch (err) {
			cli.warn(`Error loading persistent data from ${this.filename}: ${Utils.errMessage(err)}. Creating empty data file.`);
			if (Utils.isObject(defaultValue)) {
				this.data = defaultValue;
			}

			this.save();
		}
	}
}

module.exports = PersistentData;
