const fs = require('fs');
const path = require('path');
const assert = require('assert').strict;
const _ = require('lodash');

// A general-purpose "static" class with various paraphernalia functions useful
// for all sorts of things.
class Utils {
	static now() {
		return new Date().getTime();
	}
	
	// Gets a list of all the keys that are in obj1 and not in obj2.
	static getSubKeys(obj1, obj2) {
		var k1 = Object.keys(obj1);
		return k1.filter(function(x) {
			return obj2[x] === undefined;
		});
	}
	
	// Splits two collections into three lists of "things to add," "things
	// to remove" and "things to keep".
	// Values that have the same keys in the old and the new are checked for
	// equality - if they are equal they are put in "things to keep", otherwise
	// they are marked for removal and re-addition.
	// 
	// NOTE: The contents of the objects need to be possible to check for
	// equality by the Utils.equals() function!
	static oldNewSplit(oldCollection, newCollection) {
		let add = {};
		let keep = {};
		let remove = {};
		
		Object.keys(newCollection).forEach(key =>
		{
			if (key in oldCollection) {
				// If a key is present in both collections, keep it if the
				// values are the same, otherwise mark the old one for removal
				// and the new one for addition
				if (Utils.equals(oldCollection[key], newCollection[key])) {
					keep[key] = newCollection[key];
				} else {
					remove[key] = oldCollection[key];
					add[key] = newCollection[key];
				}
			} else {
				// If a key is only present in the new one, it needs to be added
				add[key] = newCollection[key];
			}
		});
		
		// Anything in the old collection that isn't in the new collection
		// should be removed
		Object.keys(oldCollection).forEach(key => {
			if (!(key in newCollection)) {
				remove[key] = oldCollection[key];
			}
		});
		
		return { add, keep, remove };
	}
	
	// Returns a random real number in the range: min <= num < max
	static randomRange(min, max) {
		return min + Math.random() * (max - min);
	}
	
	// Returns a random real INTEGER in the range: min <= num < max
	static randomInt(min, max) {
		return min + Math.floor(Math.random() * (max - min));
	}
	
	// Returns a random key in the given object.
	static randomKey(obj) {
		let keys = Object.keys(obj);
		return keys[Utils.randomInt(0, keys.length)];
	}
	
	// Returns a random value in the given object.
	static randomValue(obj) {
		return obj[Utils.randomKey(obj)];
	}
	
	// Returns a random element in the given array
	static randomElement(arr) {
		return arr[Utils.randomInt(0, arr.length)];
	}
	
	// Returns a random real number in the range:
	// 	base - variance <= num < base + variance
	static randomInRadius(base, variance) {
		return Utils.randomRange(base - variance, base + variance);
	}
	
	// Returns a random key from an object, with each value having a differet
	// chance of being selected based on weight.
	// A weight can be any positive number. If one value has the weight of X and
	// another has the weight of 2X, the odds of the latter being chosen are
	// twice as high as those of the former being chosen.
	// The probability of a specific value being chosen is equal to the weight
	// of that value divided by the sum of all the weights.
	// 
	// Parameters:
	// 	obj					The object to choose from.
	// 	[elementWeightFunc]	A function that takes a value (not a key!) from the
	// 						object and returns its weight. It must return the
	// 						same number for the same value from the moment this
	// 						function starts and until it finishes (but
	// 						subsequent calls to this function on the same object
	// 						can have different weight values with no concern, if
	// 						that's something you need for some reason; see the
	// 						Candy Game module for an example of this).
	// 						This parameter is optional. If it is omitted, the
	// 						function assumes that the values in the object *are*
	// 						the weights.
	static weightedRandomKey(obj, elementWeightFunc) {
		if (!elementWeightFunc) {
			elementWeightFunc = x => x;
		}
		
		let totalWeight = Object.values(obj).reduce(
			(soFar, current) => soFar + elementWeightFunc(current),
			0);
		
		let choice = Math.random() * totalWeight;
		let sum = 0;
		for (let key in obj) {
			sum += elementWeightFunc(obj[key]);
			if (choice < sum) {
				return key;
			}
		}
	}
	
	// Returns true iff the given value is of the object type.
	static isObject(val) {
		return typeof val === 'object' && val !== null;
	}
	
	// Copies properties from the given defaults object (defs) to the given
	// object if they are not already present in the given object.
	// Works recursively, so that you can include defaults for sub-objects, but
	// in order to support that, this disallows objects to be values themselves.
	// 
	// Examples:
	// 
	// 	def = {
	// 		a: 3,
	// 		b: 1,
	// 	}
	// 	obj = {
	// 		a: 5,
	// 	}
	// 	==> result = {
	// 		a: 5,
	// 		b: 1,
	// 	}
	// 	
	// 	def = {
	// 		x: 4,
	// 		stuff: {
	// 			y: 5,
	// 			z: 9,
	// 		},
	// 	}
	// 	obj = {
	// 		stuff: {
	// 			z: 3,
	// 		},
	// 	}
	// 	==> result = {
	// 		x: 4,
	// 		stuff: {
	// 			y: 5,
	// 			z: 3,
	// 		},
	// 	}
	// 
	// 	def = {
	// 		x: 4,
	// 		stuff: {
	// 			y: 5,
	// 			z: 9,
	// 		},
	// 	}
	// 	obj = {
	// 		x: 3,
	// 	}
	// 	==> result = {
	// 		x: 3,
	// 	}
	// 
	static applyDefaults(obj, defs) {
		Object.keys(defs).forEach(key => {
			if (defs.hasOwnProperty(key)) {
				// If the value here is another object, proceed recursively
				// to apply the sub-object defaults
				if (key in obj && obj[key] !== undefined) {
					if (Utils.isObject(defs[key])) {
						Utils.applyDefaults(obj[key], defs[key]);
					}
				} else {
					if (!Utils.isObject(defs[key])) {
						obj[key] = defs[key];
					}
				}
			}
		});
	}
	
	// Gets a list of sub-directory names in the given directory.
	// 
	// Taken from:
	// https://stackoverflow.com/questions/18112204/get-all-directories-within-directory-nodejs/24594123
	static getDirectories(source) {
	  return fs.readdirSync(source, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);
	}
	
	// Gets a list of file names (without the paths) in the given directory.
	static getFiles(source) {
	 	return fs.readdirSync(source, { withFileTypes: true })
			.filter(dirent => dirent.isFile())
			.map(dirent => dirent.name);
	}
	
	// Gets a list of file paths in the given directory.
	static getFilePaths(source) {
	 	return fs.readdirSync(source, { withFileTypes: true })
			.filter(dirent => dirent.isFile())
			.map(dirent => path.resolve(source, dirent.name));
	}
	
	// Gets a list of file paths in the given directory.
	static getFileNamesAndPaths(source) {
	 	let fileNames = fs.readdirSync(source, { withFileTypes: true })
			.filter(dirent => dirent.isFile());
	 	let res = {};
	 	fileNames.forEach(dirent => {
	 		res[dirent.name] = path.resolve(source, dirent.name);
	    });
	 	return res;
	}
	
	static tryReadJSON(path) {
		let rawData = null;
		
		// If there's an error reading from file
		try {
			rawData = fs.readFileSync(path);
			return JSON.parse(rawData);
		} catch (err) {
			return null;
		}
	}
	
	// Turns an array into a correct form of a list in English with the given
	// transition word before the final item.
	// Examples:
	// 	makeEnglishAndList(['a', 'b', 'c'], 'and') === 'a, b and c'
	// 	makeEnglishAndList(['a', 'b', 'c'], 'or') === 'a, b or c'
	// 	makeEnglishAndList(['a', 'b', 'c'], 'schnitzel') === 'a, b schnitzel c'
	// 	makeEnglishAndList(['c'], 'and') === 'c'
	static makeEnglishList(items, transitionWord) {
		assert(Array.isArray(items),
			'An array is required to make an English list.');
		
		if (items.length === 0) {
			return '';
		} else if (items.length === 1) {
			// A list of one item is just that item itself
			return items[0];
		}
		
		// Here we have at least two items, so it's going to end with "X and Y"
		let result = `${items[items.length - 2]} ${transitionWord} ${items[items.length - 1]}`;
		
		// Now we add "item, " for each item, so we get something that
		// looks like "A, B, C, X and Y"
		for (let i = 0; i < items.length - 2; i++) {
			result = `${items[i]}, ${result}`;
		}
		
		return result;
	}
	
	// Turns an array into a correct form of a list in English.
	// Examples:
	// 	makeEnglishAndList(['a', 'b', 'c']) === 'a, b and c'
	// 	makeEnglishAndList(['b', 'c']) === 'b and c'
	// 	makeEnglishAndList(['c']) === 'c'
	// 	makeEnglishAndList(['a', 'b', 'c', 5, 6]) === 'a, b, c, 5 and 6'
	static makeEnglishAndList(items) {
		return Utils.makeEnglishList(items, 'and');
	}
	
	// Turns an array into a correct form of a list in English.
	// Examples:
	// 	makeEnglishAndList(['a', 'b', 'c']) === 'a, b or c'
	// 	makeEnglishAndList(['b', 'c']) === 'b or c'
	// 	makeEnglishAndList(['c']) === 'c'
	// 	makeEnglishAndList(['a', 'b', 'c', 5, 6]) === 'a, b, c, 5 or 6'
	static makeEnglishOrList(items) {
		return Utils.makeEnglishList(items, 'or');
	}
	
	// Very simplistic function for adding a singular definitive article
	// for a word. Uses the first letter only to decide, so no guarantees here...
	// Examples:
	//  definiteSingularFor('chair') === 'a chair'
	//  definiteSingularFor('object') === 'an object'
	//  definiteSingularFor('herb') === 'an herb'  <-- Note this!
	//  definiteSingularFor('university') === 'an university' <-- Note this!
	static definiteSingularFor(word) {
		if (['a', 'e', 'i', 'o', 'u'].includes(word[0].toLowerCase())) {
			return 'an ' + word;
		} else {
			return 'a ' + word;
		}
	}
	
	// Returns true iff every key in sub is also a key in obj
	static isKeySubset(sub, obj) {
		return Object.keys(sub).reduce(
			(soFar, key) => soFar && (key in obj), true);
	}
	
	// Returns true iff every element in sub is also an element in arr
	static isArraySubset(sub, arr) {
		return sub.reduce(
			(soFar, element) => soFar && arr.includes(element), true);
	}
	
	static arraysHaveSameValues(arr1, arr2) {
		return _.isEqual([...arr1].sort(), [...arr2].sort());
	}
	
	static ensureDirExists(path) {
		try {
			fs.mkdirSync(path);
		} catch(err) { }
	}
	
	// From MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
	static escapeRegExp(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}
	
	// Finds all the matches of the given regular expression in the given string, invokes the given
	// replacement function on the match (parameters: matchString, matchObject) and replaces the
	// found match with its return value. Basically, it's a smart-replace with a function saying
	// what should go in place of each found instance of the search expression.
	static regExpGroupReplace(regex, str, replaceFunc) {
		// If the 'g' flag isn't included, the loop will run forever since the RegExp isn't stateful
		if (!regex.flags.includes('g')) {
			regex = new RegExp(regex.source, regex.flags + 'g');
		}
		
		let match;
		let result = '';
		let lastStartIndex = 0;
		while ((match = regex.exec(str)) !== null) {
			result += str.substring(lastStartIndex, match.index);
			result += replaceFunc(match[0], match);
			lastStartIndex = match.index + match[0].length;
		}
		
		// If the last expression didn't cover the rest of the string, we need to add the suffix
		// to our result string
		if (lastStartIndex < str.length) {
			result += str.substring(lastStartIndex);
		}
		
		return result;
	}
	
	static baseName(filename) {
		return filename.split('.').slice(0, -1).join('.');
	}
	
	static objectWith(obj, extras) {
		return _.assign(_.cloneDeep(obj), extras);
	}
	
	
	// Checks for equality between two values.
	// Only supports basic value types.
	// 
	// Taken from:
	// https://github.com/ReactiveSets/toubkal/blob/master/lib/util/value_equals.js
	static equals( a, b, enforce_properties_order, cyclic ) {
		return a === b       // strick equality should be enough unless zero
			&& a !== 0         // because 0 === -0, requires test by _equals()
			|| _equals( a, b ) // handles not strictly equal or zero values
		;
		
		function _equals( a, b ) {
			// a and b have already failed test for strict equality or are zero
			
			var s, l, p, x, y;
			
			// They should have the same toString() signature
			if ( ( s = toString.call( a ) ) !== toString.call( b ) ) return false;
			
			switch( s ) {
				default: // Boolean, Date, String
					return a.valueOf() === b.valueOf();
				
				case '[object Number]':
					// Converts Number instances into primitive values
					// This is required also for NaN test bellow
					a = +a;
					b = +b;
					
					return a ?         // a is Non-zero and Non-NaN
							a === b
						:                // a is 0, -0 or NaN
							a === a ?      // a is 0 or -O
							1/a === 1/b    // 1/0 !== 1/-0 because Infinity !== -Infinity
						: b !== b        // NaN, the only Number not equal to itself!
					;
				// [object Number]
				
				case '[object RegExp]':
					return a.source   == b.source
						&& a.global     == b.global
						&& a.ignoreCase == b.ignoreCase
						&& a.multiline  == b.multiline
						&& a.lastIndex  == b.lastIndex
					;
				// [object RegExp]
				
				case '[object Function]':
					return false; // functions should be strictly equal because of closure context
				// [object Function]
				
				case '[object Array]':
					if ( cyclic && ( x = reference_equals( a, b ) ) !== null ) return x; // intentionally duplicated bellow for [object Object]
					
					if ( ( l = a.length ) != b.length ) return false;
					// Both have as many elements
					
					while ( l-- ) {
						if ( ( x = a[ l ] ) === ( y = b[ l ] ) && x !== 0 || _equals( x, y ) ) continue;
						
						return false;
					}
					
					return true;
				// [object Array]
				
				case '[object Object]':
					if ( cyclic && ( x = reference_equals( a, b ) ) !== null ) return x; // intentionally duplicated from above for [object Array]
					
					l = 0; // counter of own properties
					
					if ( enforce_properties_order ) {
						var properties = [];
						
						for ( p in a ) {
							if ( a.hasOwnProperty( p ) ) {
								properties.push( p );
								
								if ( ( x = a[ p ] ) === ( y = b[ p ] ) && x !== 0 || _equals( x, y ) ) continue;
								
								return false;
							}
						}
						
						// Check if 'b' has as the same properties as 'a' in the same order
						for ( p in b )
							if ( b.hasOwnProperty( p ) && properties[ l++ ] != p )
								return false;
					} else {
						for ( p in a ) {
							if ( a.hasOwnProperty( p ) ) {
								++l;
								
								if ( ( x = a[ p ] ) === ( y = b[ p ] ) && x !== 0 || _equals( x, y ) ) continue;
								
								return false;
							}
						}
						
						// Check if 'b' has as not more own properties than 'a'
						for ( p in b )
							if ( b.hasOwnProperty( p ) && --l < 0 )
								return false;
					}
					
					return true;
				// [object Object]
			} // switch toString.call( a )
		} // _equals()
	}
	
	// Taken from:
	// https://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object
	// 
	// IMPORTANT NOTE!!!
	// Only use this for simple objects that contain primitive data and/or
	// arrays and objects of such simple objects!
	// This function cannot copy complex objects (e.g. custom classes and
	// functions).
	static clone(obj) {
		var copy;
		
		// Handle the 3 simple types, and null or undefined
		if (null == obj || "object" != typeof obj) return obj;

		// Handle Date
		if (obj instanceof Date) {
			copy = new Date();
			copy.setTime(obj.getTime());
			return copy;
		}
		
		// Handle Array
		if (obj instanceof Array) {
			copy = [];
			for (var i = 0, len = obj.length; i < len; i++) {
				copy[i] = Utils.clone(obj[i]);
			}
			return copy;
		}
		
		// Handle Object
		if (obj instanceof Object) {
			copy = {};
			for (var attr in obj) {
				if (obj.hasOwnProperty(attr)) copy[attr] = Utils.clone(obj[attr]);
			}
			return copy;
		}
		
		throw new Error("Unable to copy obj! Its type isn't supported.");
	}
}

module.exports = Utils;
