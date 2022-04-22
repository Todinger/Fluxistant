const SEManager = requireMain('./seManager');
const Variable = require('./Variables/functionVariable');

const GlobalVars = [
	new Variable({
		name: 'Username (`$user`)',
		description: 'The name of the user who used the function.',
		example: 'If `!hi` gives the text "Hello, `$user`!" then when a user called Arya types `!hi` in the chat, the bot will say: "Hello, Arya!"',
		
		expr: '$user',
		replacement: data => data.context.user.displayName,
	}),
	
	new Variable({
		name: 'Function Argument (`$1`, `$2`, `$3`, ...)',
		description: 'Returns one of the arguments used to invoke the function. Accepts any number as the index.',
		example: 'For `!somecommand` defined to say "`$1` is better than `$4`", writing "`!somecommand` Hello, how are you?" will produce: "Hello, is better than you?"',
		
		expr: /\$(\d+)/,
		replacement: data => {
			let args = data.context.params.in;
			let num = Number(data.matchData[1]);
			if (1 <= num && num <= args.length && args[num - 1] !== undefined) {
				return args[num - 1];
			} else {
				throw `Function argument out of range: given ${data.matchData[0]} but the index must be between 1 and ${args.length}.`;
			}
		},
	}),
	
	new Variable({
		name: 'All Function Arguments (`$all`)',
		description: 'Returns all the arguments used in the function invocation.',
		example: 'For `!somecommand` defined to say "You said \'`$all`\'", writing "`!somecommand` Hello, how are you?" will produce: "You said \'Hello, how are you?\'"',
		
		expr: '$all',
		replacement: data => {
			if (data.context.params.in.length > 0 && data.context.params.in[0] !== undefined) {
				return data.context.params.in.join(' ');
			} else {
				return data.matchString; // Return the expression unchanged
			}
		},
	}),
	
	new Variable({
		name: 'Updated User Points (`$points:username`, `$namedpoints:username`)',
		description: "If `username`'s points were modified by the function's Points setting, returns their points after the update. Using namedpoints includes the name of your SE points, adjusted for plurality. NOTE: If the wrong username is used, this will say '???' instead.",
		example: 'If adding a Points entry for bobross with 50 points, and he had 100 beforehand, writing "GJ Bob, you now have $points:bobross points!" would show "GJ Bob, you now have 150 points!" If your points are called "antenna"/"antennae", in the same situation, writing "GJ Bob, you now have $namedpoints:bobross!" would show "GJ Bob, you now have 150 antennae!", whereas if he had 1 point it would show "GJ Bob, you now have 1 antenna!"',
		
		expr: /\$(named)?points:(\w+)/,
		replacement: data => {
			let named = data.matchData[1] != null;
			let username = data.matchData[2];
			let points = data.context.points[username.toLowerCase()];
			if (points === undefined || points === null) {
				throw `Username without any points set given: ${username}`;
			}
			
			if (named) {
				return SEManager.pointsString(points);
			} else {
				return points.toString();
			}
		},
	}),
];

module.exports = GlobalVars;
