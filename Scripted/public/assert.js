/**
 * [Forked from https://gist.github.com/2651899]
 *
 * A console.assert which actually stop the exectution.
 * default console.assert() is a plain display, such as console.log() or console.error();
 * It doesnt stop the execution like assert() is meant to do. This is a little code to 
 * "workaround this limitation" :)
 *
 * Usage:
 * console.assert(foo === bar); // Will throw if not equal
 * console.assert(foo === bar, 'Dude, foo does not equal bar'); // Will throw with custom error message
 * console.assert(foo === bar, 'Y U NO EQUAL?', true); // Will stop execution and open dev tools
 */
console.assert	= function(cond, text, dontThrow){
  if ( cond ) return;
  if ( dontThrow ) {
    debugger;
  } else {
    throw new Error(text || "Assertion failed!");
  }
};
