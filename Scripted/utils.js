class Utils {
	// Gets a list of all the keys that are in obj1 and not in obj2
	static getSubKeys(obj1, obj2) {
		var k1 = Object.keys(obj1);
		return k1.filter(function(x) {
			return obj2[x] === undefined;
		});
	}
	
	// Splits two collections into three lists of "things to add," "things
	// to remove" and "things to keep"
	// Values that have the same keys in the old and the new are checked for
	// equality - if they are equal they are put in "things to keep", otherwise
	// they are marked for removal and re-addition
	static oldNewSplit(oldCollection, newCollection) {
		let add = {};
		let keep = {};
		let remove = {};
		
		Object.keys(newCollection).forEach(key =>
		{
			if (key in oldCollection) {
				if (Utils.equals(oldCollection[key], newCollection[key])) {
					keep[key] = newCollection[key];
				} else {
					remove[key] = oldCollection[key];
					add[key] = newCollection[key];
				}
			} else {
				add[key] = newCollection[key];
			}
		});
		
		Object.keys(oldCollection).forEach(key => {
			if (!(key in newCollection)) {
				remove[key] = oldCollection[key];
			}
		});
		
		return { add, keep, remove };
	}
	
	static randomRange(min, max) {
		return min + Math.random() * (max - min);
	}
	
	static randomInt(min, max) {
		return min + Math.floor(Math.random() * (max - min));
	}
	
	static randomKey(obj) {
		let keys = Object.keys(obj);
		return keys[randomInt(0, keys.length)];
	}
	
	static randomValue(obj) {
		return obj[randomKey(obj)];
	}
	
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
}

module.exports = Utils;