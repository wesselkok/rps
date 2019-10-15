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
        var clientId = socket.id;
        var team = GetNewClientTeam();
        clients.push({
            'clientId': clientId,
            'team': team,
        });
        console.log(`Client Connected: ${clientId} in team ${team}`);
        io.to(clientId).emit('team', team);
        socket.on('chat message', function(msg){
        io.emit('chat message', msg);
        });
    }
    
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

    // Reset voting amounts to zero
    socket.on('game reset round', function(){
        ResetVotes(voting_red);
        ResetVotes(voting_blue);
        // enable voting
        socket.broadcast.emit('voting status', true);
    });

    // Hide Player voting buttons
    socket.on('hideplayervoting', function(){
        console.log('Hide Player Voting');
        socket.broadcast.emit('voting status', false);
    });

    // Show Player voting buttons
    socket.on('showplayervoting', function(){
        console.log('Show Player Voting');
        socket.broadcast.emit('voting status', true);
    });

    // Game requests a winning team.
    socket.on('game result', function(){
        console.log('Request Game Results');
        var result;
        if(socket.handshake.query.name != "game"){
            result = -1;
        }
        var itemRed = GetWinningItem(voting_red);
        var itemBlue = GetWinningItem(voting_blue);
        if (!itemRed || !itemBlue){
            result =  -1;
        } else {
            // Check winning result. -1 = failed, 0 = draw, 1 = red, 2 = blue
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
    return (clients.filter(x => x.team == "red").length >= clients.filter(x => x.team == "blue").length)? 'blue' : 'red';
}

function GetWinningItem(list){
    var item = list.sort((a, b) => b.amount - a.amount)[0];
    if (item.amount == 0){
        item = list[Math.floor(Math.random()*list.length)];
    }
    return item;
}

function ResetVotes(list){
    list.forEach(e => {
        e.amount = 0;
    });
}
