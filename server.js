const app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
const express = require('express');

var clients = [];

var voting_red = [
    {
        type: 'Rock',
        amount: 0,
    },
    {
        type: 'Paper',
        amount: 0,
    },
    {
        type: 'Scissors',
        amount: 0,
    }
];
var voting_blue = [
    {
        type: 'Rock',
        amount: 0,
    },
    {
        type: 'Paper',
        amount: 0,
    },
    {
        type: 'Scissors',
        amount: 0,
    }
];

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

    // Vote
    socket.on('vote', function(obj){
        if (!obj){
            return;
        }
        // Red
        if (obj.team == 'red'){
            var voting = voting_red.find(x => x.type == obj.value);
            if(voting)
                voting.amount++;
        }
        // Blue
        else {
            var voting = voting_blue.find(x => x.type == obj.value);
            if(voting)
                voting.amount++;
        }
    });

    socket.on('game result', function(){
        var result;
        if(socket.handshake.query.name != "game"){
            result = -1;
        }
        var itemRed = GetWinningItem(voting_red);
        var itemBlue = GetWinningItem(voting_blue);
        if (!itemRed || !itemBlue){
            result =  -1;
        } else {
            // Check winning result. 0 = draw, 1 = red, 2 = blue
            if(itemRed.type == itemBlue.type){
                result = 0;
            } else if (itemRed.type == "Rock"){
                if(itemBlue.type == "Paper"){
                    result = 2;
                } else {
                    result = 1;
                }
            } else if (itemRed.type == "Paper"){
                if (itemBlue.type == "Scissors"){
                    result = 2;
                } else {
                    result = 1;
                }
            } else {
                if(itemBlue.type == "Paper"){
                    result = 1;
                } else {
                    result = 2;
                }
            }
        }
        socket.emit('game get result', result);
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

function GetWinningItem(list){
    return list.sort((a, b) => b.amount - a.amount)[0];
}
