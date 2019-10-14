const app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
const express = require('express');

var clients = [];

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
    if(socket.handshake.query.name != "game"){
        // New client connected
        console.log('New client connected');
        var clientId = socket.id;
        var team = GetNewClientTeam();
        clients.push({
            'clientId': clientId,
            'team': team,
        });
        console.log(team);
        console.log(clientId);
        io.to(clientId).emit('team', team);
        socket.on('chat message', function(msg){
        io.emit('chat message', msg);
        });
    }

    console.log(clients.length);
    
    // Disconnect
    socket.on('disconnect', function() {
        console.log('Disconnected');
        clients.splice(clients.findIndex(x => x.clientId == socket.id), 1);
    });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

function GetNewClientTeam(){
    var RedCount = clients.filter(x => x.team == "red").length;
    var BlueCount = clients.filter(x => x.team == "blue").length;
    if (RedCount > BlueCount){
        return 'blue';
    }
    return 'red';
}
