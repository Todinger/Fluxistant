const assert = require('assert').strict;

function _getStack() {
	let orig = Error.prepareStackTrace;
	Error.prepareStackTrace = function(_, stack){ return stack; };
	let err = new Error;
	Error.captureStackTrace(err, arguments.callee);
	let stack = err.stack;
	Error.prepareStackTrace = orig;
	return stack;
}

class Errors {
	throwError(msg, callOffset) {
		callOffset = callOffset || 0;
		let stack = _getStack();
		let callerInfo = stack[2 + callOffset];
		throw `${msg} at ${callerInfo.getFileName()}:${callerInfo.getLineNumber()}`;
	}
	
	abstract() {
		let stack = _getStack();
		let functionName = stack[1].getFunctionName();
		this.throwError(`Abstract method invoked: ${functionName}()`, 1);
	}
	
	verifyType(value, expectedTypeString) {
		if (typeof value !== expectedTypeString) {
			this.throwError(`Wrong type: expected ${expectedTypeString}, got ${typeof value}`);
		}
	}
	
	ensureNonEmptyString(value, message) {
		assert(typeof value == 'string' && value !== '', message);
	}
	
	ensureRegexString(str, regex, message) {
		assert(typeof str == 'string', message);
		assert(regex.test(str), message);
	}
}

module.exports = new Errors();
