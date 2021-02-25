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




const ffi = require('ffi-napi');
const ref = require('ref-napi');

// create foreign function
const user32 = new ffi.Library('user32', {
	'GetForegroundWindow': ['long', []],
	'GetWindowTextA': ['int', ['long', 'string', 'long']],
	'FindWindowA': ['int', ['string', 'string']],
});
// const kernel32 = new ffi.Library('kernel32', {
// 	'K32GetProcessImageFileNameA': ['long', ['long', 'string', 'long']],
// 	'GetLastError': ['long', []],
// });

const bufSize = 256;
let buffer = Buffer.alloc(bufSize);
let x = buffer.length;
console.log(x);

// let hwnd1 = user32.FindWindowA(null, 'Phasmophobia');
// let hwnd2 = user32.FindWindowA(null, 'Bla');
// let hwnd3 = user32.FindWindowA(null, 'Phasmophobian');
// let hwnd4 = user32.FindWindowA(null, 'Phasmophobi');
// let hwnd5 = user32.FindWindowA(null, 'mop');
// console.log(hwnd);

setInterval(
	() => {
		let activeWindow = user32.GetForegroundWindow();
		// console.log(user32.GetForegroundWindow());
		user32.GetWindowTextA(activeWindow, buffer, bufSize);
		let winTitle = ref.readCString(buffer, 0);
		// console.log(winTitle);
		if (winTitle === 'Phasmophobia') {
			console.log("You're playing Phasmophobia!");
		}
	},
	3000);



/*
const activeWindow = user32.GetForegroundWindow();

const bufSize = 256;
let buffer = Buffer.alloc(bufSize);
// let retval = kernel32.K32GetProcessImageFileNameA(activeWindow, buffer, bufSize);
let retval = user32.GetWindowTextA(activeWindow, buffer, bufSize);
let errcode = kernel32.GetLastError();
let processPath = ref.readCString(buffer, 0);

console.log(activeWindow);
*/

/*
const { C, K, U } = require('win32-api');
const ref = require('ref-napi');

const wUser32 = U.load();
const wKernel32 = K.load();
const c = C.load();

let wActiveWindow = wUser32.GetForegroundWindow();

// const bufSize = 256;
const wBuffer = Buffer.alloc(bufSize);
// let retval = kernel32.K32GetProcessImageFileNameA(activeWindow, buffer, bufSize);
let errcode = wKernel32.GetLastError();

console.log(wActiveWindow);
*/
