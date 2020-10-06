function now() {
	return new Date().getTime();
}

function randomRange(min, max) {
	return min + Math.random() * (max - min);
}

function randomInt(min, max) {
	return min + Math.floor(Math.random() * (max - min));
}

function randomKey(obj) {
	let keys = Object.keys(obj);
	return keys[randomInt(0, keys.length)];
}

function randomValue(obj) {
	return obj[randomKey(obj)];
}

Object.filter = (obj, predicate) => 
	Object.keys(obj)
		.filter( key => predicate(obj[key]) )
		.reduce( (res, key) => (res[key] = obj[key], res), {} );

function applyDefaults(obj, defs) {
	Object.keys(defs).forEach(key => {
		if (defs.hasOwnProperty(key) && !(key in obj)) {
			obj[key] = defs[key];
		}
	});
}
