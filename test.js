const path = require('path');
const glob = require('glob');
const USERIMAGE_URL = '/assets/user-images/';
glob('..\\..\\Images\\User-Specific\\*.png', {}, (err, files) => {
	files.forEach(file => {
		let username = path.parse(file).name;
		let imageext = path.parse(file).ext;
		let imageurl = USERIMAGE_URL + username + imageext;
		console.log(`${username}: ${imageurl}`);
	});
});