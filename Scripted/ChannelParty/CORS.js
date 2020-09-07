const cors_api_url = 'https://cors-anywhere.herokuapp.com/';

function doCORSRequest(options, onResults) {
	var x = new XMLHttpRequest();
	x.open(options.method, cors_api_url + options.url);
	x.onload = x.onerror = function() {
		onResults(x.responseText || '');
	};
	
	if (/^POST/i.test(options.method)) {
		x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	}
	
	x.send(options.data);
}


function doCORSGet(url, onResults) {
	doCORSRequest({
		method: 'GET',
		url: url,
		data: '',
	}, onResults);
}
