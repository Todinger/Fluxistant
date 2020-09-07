const path = require('path');
const glob = require('glob');

// Basic server setup
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

const PORT = 3333;


// Self-Images
const USERIMAGE_DIR = '../../Images/User-Specific';
const USERIMAGE_URL = '/assets/user-images/';
app.use(USERIMAGE_URL,
	express.static(path.join(__dirname, USERIMAGE_DIR)));

function getUserImageList(socket) {
	console.log('User image list requested.');
	glob(path.join(USERIMAGE_DIR, '*.png'), {}, (err, files) => {
		let imageList = {};
		files.forEach(file => {
			let username = path.parse(file).name;
			let imageext = path.parse(file).ext;
			let imageurl = USERIMAGE_URL + username + imageext;
			imageList[username] = imageurl;
		});
		
		socket.emit('userImageList', imageList);
	});
}

io.on('connection', socket => {
	socket.on('getUserImageList', () => getUserImageList(socket));
});

// Load all the effects we have
var Effect = require('./effect');
var EffectManager = require('./effectManager');
EffectManager.loadAll(app, express, '/fx/', 'Effects');

server.listen(PORT);
console.log(`Listening on port ${PORT}...`);
