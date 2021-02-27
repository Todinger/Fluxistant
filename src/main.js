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
if (args.includes('--compile-configs')) {
	FluxBot.setupConfigOnly();
	process.exit(0);
} else {
	FluxBot.setupAllAndStart();
}
