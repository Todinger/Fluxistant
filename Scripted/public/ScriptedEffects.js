
const FADE_TIME = 500;

var scripts = {};

function addFrame(webname, source, zindex) {
	let frame = $(`<div id="script_${webname}" class="framediv"><iframe src="${source}" frameborder="0" allowtransparency="yes" scrolling="no"></iframe></div>`);
	if (zindex !== undefined) {
		frame.css('z-index', zindex);
	}
	
	frame.appendTo($('#frames'));
	return frame;
}

function getScript(scriptName) {
	console.assert(scriptName in scripts, `Unknown script: ${scriptName}`);
	return scripts[scriptName];
}

var socket = io();

// Expects a collection of objects, each with .source and optionally .zindex
socket.on('scriptList', scriptList => {
	console.log('Received scripts list.');
	Object.keys(scriptList).forEach(scriptName => {
		scripts[scriptName] = {
			name: scriptName,
			source: scriptList[scriptName].source,
			frame: addFrame(
				scriptList[scriptName].webname,
				scriptList[scriptName].source,
				scriptList[scriptName].zindex),
		};
	});
});

socket.on('hide', scriptName => {
	getScript(scriptName).frame.fadeOut(FADE_TIME);
});

socket.on('show', scriptName => {
	getScript(scriptName).frame.fadeIn(FADE_TIME);
});

socket.emit('connectTo', 'ScriptedEffects');

socket.emit('getScripts');

function ask(event, data) {
	socket.emit('ask', { event, data });
}
