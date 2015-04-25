// Declare variables and array to store current game room information
var io;
var gameSocket;
var gameRooms = [];

/**
 * This function is called by index.js to initialize a new game instance.
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket){
    console.log('btlgame running')
    io = sio;
    gameSocket = socket;
    // emit event to clients on connection
    gameSocket.emit('connected', { message: "You are connected!" });

    // Host Events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomFull', hostPrepareGame);
    gameSocket.on('hostCountdownFinished', hostStartGame);

    // Player Events
    gameSocket.on('playerJoinGame', playerJoinGame);
    // gameSocket.on('playerAnswer', playerFire);
    gameSocket.on('gameSize', gameSize);
    gameSocket.on('hitShip', hitShip);
    gameSocket.on('shipGenerator', shipGenerator);
    gameSocket.on('guess', guess);
    gameSocket.on('hit', hit);
    gameSocket.on('test', test);
    gameSocket.on('addGame', addGame);
    gameSocket.on('sunk', sunkShip);
}

/* *******************************
   *                             *
   *       HOST FUNCTIONS        *
   *                             *
   ******************************* */

/**
 * The 'START' button was clicked and 'hostCreateNewGame' event occurred.
 */
// function hostCreateNewGame() {
//     // Create a unique Socket.IO Room
//     var thisGameId = ( Math.random() * 100000 ) | 0;
//     // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
//     this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});
//     console.log(mySocketId)
//     // Join the Room and wait for the players
//     this.join(thisGameId.toString());


// };

/*
 * Two players have joined. Alert the host!
 * @param gameId The game ID / room ID
 */
function hostPrepareGame(gameId) {
    console.log('beg of hostPrepareGame has fired..')
    var sock = this;
    var turn = 0;
    var data = {
        mySocketId : sock.id,
        gameId : gameId,
        turn : turn
    };
    console.log("All Players Present. Preparing game...");
    io.sockets.in(data.gameId).emit('beginNewGame', data);
}

/*
 * The Countdown has finished, and the game begins!
 * @param gameId The game ID / room ID
 */
function hostStartGame(data) {
    console.log('Game Started.');

    console.log('host fires first...');
    console.log(data.turn);

};

/* *****************************
   *                           *
   *     PLAYER FUNCTIONS      *
   *                           *
   ***************************** */

/**
 * A player clicked the 'START GAME' button.
 * Attempt to connect them to the room that matches
 * the gameId entered by the player.
 * @param data Contains data entered via player's input - playerName and gameId.
 */
function playerJoinGame(data) {
    console.log('Player ' + data.playerName + ' attempting to join game: ' + data.gameId );
    gameSize();
    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the room ID in the Socket.IO manager object.
    var room = gameSocket.manager.rooms["/" + data.gameId];
    var index = gameRooms.indexOf(data.gameId);
    console.log(index + " index!")
    if (index > -1) {
    gameRooms.splice(index, 1);
    }

    console.log(gameRooms);
    // If the room exists...
    if( room != undefined ){
        // attach the socket id to the data object.
        data.mySocketId = sock.id;

        // Join the room
        sock.join(data.gameId);

        console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

    } else {
        // Otherwise, send an error message back to the player.
        this.emit('error',{message: "This room does not exist."} );
    }
}

function hostCreateNewGame(data) {
    var thisGameId = ( Math.random() * 100000 ) | 0;
    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id, });
    gameRooms.push(thisGameId);
    console.log('gameRooms: ' + gameRooms);
    console.log('built in rooms: ');
    io.sockets.emit('roomFeed', 'hey');
    // Join the Room and wait for the players
    this.join(thisGameId.toString());
}

function gameSize(data){
    console.log('game size: ' + data); 
    io.sockets.emit('gameSize',data);
}

function shipGenerator(data){
    console.log(" ship gen! "+ data);


}

function test(data, row, col){
    console.log('test working on server')
    io.emit('test', data, row, col);
}

function guess(row, col){
    console.log('row + col: ' + row + col); 
    io.sockets.emit('guess', row, col);
}

function sunkShip(data, ship){
    console.log(ship.typeOfBoat + ' was sunk!')
    io.sockets.emit('sunkShip', data, ship);
}


function hit(data, row, col){
    console.log('HIT! row + col: ' + row + col); 
    io.sockets.emit('hitVessel', data, row, col);


    // return false;
}

function addGame(data){
    console.log('add game fired: ' + data.gameId)
    var roomData = data.gameId;
    
    
    io.sockets.emit('roomLabel', gameRooms)
}



function hitShip(data, usr, row, col, myRole){
    console.log("hitship!"+myRole+data.ships.locations)


if(data.round % 2 == 0){
    if(myRole === 'Host'){
            var row = data.answer[0];
            var col = data.answer[2];
            io.sockets.in(data.gameId).emit('gameChange', data, row, col);
    } else {
        console.log('its not your turn')
    };
}else{
    if(myRole === 'Player'){
            io.sockets.in(data.gameId).emit('gameChange', data, row, col);
    }else {console.log('its not your turn')};
    }
}
