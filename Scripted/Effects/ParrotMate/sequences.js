
const SEQUENCES = {
	hey: Sequence([
		Event(0, [ Sound('hey') ]),
		Event(0, [ Text('Hey! Look! Listen!\nHey! Look! Listen!') ]),
		Event(200, [ Image('wing') ]),
		Event(500, [ Image('regular') ]),
		Event(750, [ Image('look') ]),
		Event(1000, [ Image('regular') ]),
		Event(1283, [ Image('mouth') ]),
		Event(1600, [ Image('regular') ]),
		Event(1743, [ Image('mouth') ]),
		Event(2000, [ Image('regular') ]),
		
		Event(2334, [ Image('look') ]),
		Event(2600, [ Image('regular') ]),
		Event(2745, [ Image('mouth') ]),
		Event(3000, [ Image('regular') ]),
		Event(3167, [ Image('mouth') ]),
		Event(3600, [ Image('regular') ]),
		
		Event(4000, [ Image('wing') ]),
		Event(4500, [ Image('regular') ]),
	]),
	
	laughter: Sequence([
		Event(0, [ Sound('laughter') ]),
		Event(160, [ Image('mouth') ]),
		Event(354, [ Image('regular') ]),
		Event(548, [ Image('mouth') ]),
		Event(729, [ Image('regular') ]),
		Event(909, [ Image('mouth') ]),
		Event(1091, [ Image('regular') ]),
		Event(1273, [ Image('mouth') ]),
		Event(1458, [ Image('regular') ]),
		Event(1643, [ Image('mouth') ]),
		Event(1895, [ Image('regular') ]),
	]),
	
	behind: Sequence([
		Event(0, [ Sound('behind') ]),
		Event(173, [ Image('wing') ]),
		Event(694, [ Text('Look behind you!') ]),
		Event(694, [ Image('look') ]),
		Event(1744, [ Image('regular') ]),
	]),
	
	attention: Sequence([
		Event(0, [ Sound('attention') ]),
		Event(163, [ Image('wing') ]),
		Event(686, [ Image('regular') ]),
		Event(928, [ Text('Give me attention!') ]),
		Event(928, [ Image('wing') ]),
		Event(1183, [ Image('regular') ]),
		Event(1417, [ Image('wing') ]),
		Event(1740, [ Image('regular') ]),
		Event(2000, [ Image('regular') ]),
	]),
	
	cracker: Sequence([
		Event(0, [ Sound('cracker') ]),
		Event(187, [ Image('mouth') ]),
		Event(754, [ Image('look') ]),
		Event(1066, [ Text('Polly want a cracker!') ]),
		Event(1066, [ Image('mouth') ]),
		Event(1336, [ Image('regular') ]),
		Event(1606, [ Image('mouth') ]),
		Event(1876, [ Image('regular') ]),
	]),
	
	dl6: Sequence([
		Event(0, [ Sound('dl6') ]),
		Event(0, [ Text('Remember DL-6...') ]),
		Event(137, [ Image('mouth') ]),
		Event(376, [ Image('regular') ]),
		Event(615, [ Image('mouth') ]),
		Event(775, [ Image('regular') ]),
		Event(935, [ Image('mouth') ]),
		Event(1095, [ Image('regular') ]),
		Event(1955, [ Text('*STARE*') ]),
		Event(1955, [ Image('look') ]),
		Event(7000, [ Image('regular') ]),
	]),
	
	bigcry: Sequence([
		Event(0, [ Image('wing'), Sound('bigcry') ]),
		Event(1000, [ Image('regular') ]),
	]),
	
	cry: Sequence([
		Event(0, [ Image('wing'), Sound('cry') ]),
		Event(450, [ Image('regular') ]),
	]),
	
	died: Sequence([
		Event(0, [ Sound('died') ]),
		Event(75, [ Image('wing') ]),
		Event(675, [ Image('regular') ]),
		Event(943, [ Text('I am died.') ]),
		Event(943, [ Image('mouth') ]),
		Event(1155, [ Image('regular') ]),
		Event(1389, [ Image('mouth') ]),
		Event(2130, [ Image('regular') ]),
	]),
	
	lars: Sequence([
		Event(0, [ Sound('lars') ]),
		Event(20, [ Image('mouth') ]),
		Event(592, [ Image('regular') ]),
		Event(842, [ Text('Where is Lars?') ]),
		Event(842, [ Image('mouth') ]),
		Event(1064, [ Image('look') ]),
		Event(1331, [ Image('mouth') ]),
		Event(1625, [ Image('look') ]),
		Event(2006, [ Image('regular') ]),
	]),
	
	law: Sequence([
		Event(0, [ Sound('law') ]),
		Event(148, [ Image('mouth') ]),
		Event(649, [ Image('regular') ]),
		Event(873, [ Text('What is law?') ]),
		Event(873, [ Image('wing') ]),
		Event(1136, [ Image('look') ]),
		Event(1380, [ Image('wing') ]),
		Event(1686, [ Image('look') ]),
		Event(2119, [ Image('regular') ]),
	]),
};

soundManager.onDataLoaded(function () {
	Object.values(SEQUENCES).forEach(sequence => sequence.calculateDuration());
});
