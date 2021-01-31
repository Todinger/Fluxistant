// Returns the time right now.
function now() {
	return new Date().getTime();
}

// Returns a random real number in the range: min <= num < max
function randomRange(min, max) {
	return min + Math.random() * (max - min);
}

// Returns a random real INTEGER in the range: min <= num < max
function randomInt(min, max) {
	return min + Math.floor(Math.random() * (max - min));
}

// Returns a random key in the given object.
function randomKey(obj) {
	let keys = Object.keys(obj);
	return keys[randomInt(0, keys.length)];
}

// Returns a random value in the given object.
function randomValue(obj) {
	return obj[randomKey(obj)];
}

// Like Array.filter() only for objects, with the predicate being invoked on the
// values in the object
Object.filter = (obj, predicate) => 
	Object.keys(obj)
		.filter( key => predicate(obj[key]) )
		.reduce( (res, key) => (res[key] = obj[key], res), {} );


// Copies properties from the given defaults object (defs) to the given object
// if they are not already present in the given object.
function applyDefaults(obj, defs) {
	Object.keys(defs).forEach(key => {
		if (defs.hasOwnProperty(key) && !(key in obj)) {
			obj[key] = defs[key];
		}
	});
}
