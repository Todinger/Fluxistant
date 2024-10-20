// Basic libraries
// const { createRequire } = require('module');
const path = require('path');
// const createRequireFromPath = relativePath => createRequire(path.resolve(relativePath));
function createRequireFromPath(relativePath) {
	return subPath => require('./' + path.join(relativePath, subPath));
}

const CONFIG_ENTITIES_PATH = './Config/Entities/';

// Global require() shortcuts
global.requireMain = createRequireFromPath('./');
global.requireMod = createRequireFromPath('./Modules/');

let requireConfig = createRequireFromPath(CONFIG_ENTITIES_PATH);
global.requireConfig = entityName => requireConfig(`./${entityName}`);
global.requireModConfig =
	(modname, entityName) => global.requireMod(`./${modname}/Config/${entityName}`);

const FluxBot = require('./fluxbot');

const args = process.argv.slice(2).map(arg => arg.toLowerCase());

const logger = require('./logger');
if (args.includes('--debug')) {
	logger.setAllLevels('debug');
} else if (args.includes('--info')) {
	logger.setAllLevels('info');
}

// Log errors stemming from unhandled promise rejections
process.on("unhandledRejection", (error) => {
	logger.error(error); // This prints error with stack included (as for normal errors)
	//throw error; // Re-throw error and let the process exit with error code
	// ^ We do not do this because usually this comes from some asynchronous process - if it
	// fails, we'll accept that the process failed (so whatever invocation it was didn't work
	// this time), but we shouldn't kill the entire bot for it
});

if (args.includes('--compile-configs')) {
	FluxBot.setupConfigOnly();
	process.exit(0);
} else {
	FluxBot.setupAllAndStart();
}
