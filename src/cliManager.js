const readline = require('readline');
const EventNotifier = require('./eventNotifier');

// Responsible for direct interactions with the user.
// This constitutes of console input and output presently.
class CliManager extends EventNotifier {
	constructor() {
		super(true, true, true); // Allow dynamic events, ignore case, silent
		
		this._rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
	}
	
	// Starts listening to CLI input and shows the prompt.
	start() {
		this._prompt();
	}
	
	// What to display as the prompt.
	// This is a function rather than a constant because we might want to make
	// it show something dynamic later on.
	_promptText() {
		return '>> ';
	}
	
	// Displays the prompt and waits for input.
	_prompt() {
		this._rl.question(
			this._promptText(),
			cmdline => this._handleCommand(cmdline));
	}
	
	_clearLine() {
		readline.clearLine();  // Clear current text
		readline.cursorTo(process.stdout, 0);  // Move cursor to beginning of line
	}
	
	// Handles user input.
	// 
	// Parameters:
	// 	cmdline		The line input by the user on the CLI.
	_handleCommand(cmdline) {
		// Trim and "parse" the command ("parsing" only means isolating the
		// first word in the command, as we allow for dynamic commands which are
		// registered from outside so we have no idea what is legal and what
		// isn't)
		cmdline = cmdline.trim();
		if (cmdline.length > 0) {
			let cmdname = cmdline.split(' ')[0];
			let line = cmdline.substring(cmdname.length).trim();
			
			// If the given cmdname isn't a known event then nothing is
			// listening for it, which makes it an unknown command
			if (this._isEvent(cmdname)) {
				// For a command line "a bcd e f g", this will notify all
				// listeners that the event "a" happend with the parameter
				// "bcd e f g"
				this._notify(cmdname, line);
			} else {
				this.error(`Unknown command: ${cmdname}`);
			}
		}
		
		// Show the prompt and wait for input again
		this._prompt();
	}
	
	// Outputs information message.
	log(message) {
		this._clearLine();
		console.log(message);
		this.write(this._promptText());
	}
	
	// Outputs a warning message.
	warn(message) {
		this._clearLine();
		console.warn(message);
		// console.log(this._promptText());
	}
	
	// Outputs an error message.
	error(message) {
		this._clearLine();
		console.error(message);
		// console.log(this._promptText());
	}
	
	// Writes to the console without a trailing newline
	write(message) {
		process.stdout.write(message);
	}
}

module.exports = new CliManager();
