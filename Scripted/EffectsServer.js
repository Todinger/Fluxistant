// Basic server setup
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

app.use('/fluxlings/client', express.static(__dirname + '/client'));
app.use('/fluxlings/common', express.static(__dirname + '/common'));
app.use('/fluxlings/assets', express.static(__dirname + '/assets'));

app.get('/fluxlings/client/', (req, res) => {
  res.sendFile(__dirname + '/client/index.html');
});

// Delegation to actual classes
var ServerManager = require('./server/serverManager.js');
ServerManager.instance.init(io, server);

//var bgdo = require('./common/bgdo');
