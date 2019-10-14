const app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
const express = require('express');

// Static files
app.use(express.static('public'));

// Main Game get
app.get('/game', function(req, res){
  res.sendFile(__dirname + '/game.html');
});

// Player Control get
app.get('/', function(req, res){
  res.sendFile(__dirname + '/player.html');
});

// On Connection listener
io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
