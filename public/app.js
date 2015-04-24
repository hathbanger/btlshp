
var boatType = ["Aircraft Carrier", "Battleship", "Cruiser", "Submarine", "Destroyer"];
var boatSize = [5,4,3,2,1];
var ships = [];
jQuery(function($){    
    'use strict';
    console.log('app.js running')

    /**
     * All the code relevant to Socket.IO is collected in the IO namespace.
     *
     * @type {{init: Function, bindEvents: Function, onConnected: Function, onNewGameCreated: Function, playerJoinedRoom: Function, beginNewGame: Function, onNewWordData: Function, hostCheckAnswer: Function, gameOver: Function, error: Function}}
     */
    var IO = {

        /**
         * This is called when the page is displayed. It connects the Socket.IO client
         * to the Socket.IO server
         */
        init: function() {
            IO.socket = io.connect();
            IO.bindEvents();
        },

        /**
         * While connected, Socket.IO will listen to the following events emitted
         * by the Socket.IO server, then run the appropriate function.
         */
        bindEvents : function() {
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
            IO.socket.on('beginNewGame', IO.beginNewGame );
            // IO.socket.on('newWordData', IO.onNewWordData);
            // IO.socket.on('row', IO.onNewWordData);
            IO.socket.on('test', IO.test);
            IO.socket.on('hit', IO.hit);
            IO.socket.on('shipDamage', IO.shipDamage);
            IO.socket.on('hitVessel', IO.hitVessel);
            IO.socket.on('sunkShip', IO.sunkShip);
            // IO.socket.on('col', IO.onNewWordData);
            IO.socket.on('gameChange', IO.gameChange);            
            IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('error', IO.error );
        },

        /**
         * The client is successfully connected!
         */
        onConnected : function() {
            // Cache a copy of the client's socket.IO session ID on the App
            App.mySocketId = IO.socket.socket.sessionid;
            // console.log(data.message);
        },

        /**
         * A new game has been created and a random game ID has been generated.
         * @param data {{ gameId: int, mySocketId: * }}
         */
        onNewGameCreated : function(data) {
            App.Host.gameInit(data);
            console.log('game init!')
            $('#inputGameId').val(data.gameId);
            IO.socket.emit('addGame', data)

        },

        /**
         * A player has successfully joined the game.
         * @param data {{playerName: string, gameId: int, mySocketId: int}}
         */
        playerJoinedRoom : function(data) {
            // When a player joins a room, do the updateWaitingScreen funciton.
            // There are two versions of this function: one for the 'host' and
            // another for the 'player'.
            //
            console.log("a challenger has arrived!")
            // So on the 'host' browser window, the App.Host.updateWiatingScreen function is called.
            // And on the player's browser, App.Player.updateWaitingScreen is called.
            App[App.myRole].updateWaitingScreen(data);
        },

        /**
         * Both players have joined the game.
         * @param data
         */
        beginNewGame : function(data) {
            App[App.myRole].gameCountdown(data);
            console.log('countdown')
            // displayNewGameScreen(data.gameSize);
        },


        gameChange : function(data, row, col){
            var hisShot =  row + " " + col;
            for(var k = 0; k < 3; k++){
                if(ships[k].locations.indexOf(hisShot) >= 0){
                    ships[k].hits[ships[k].locations.indexOf(hisShot)] = "hit";
                    console.log(ships[k].hits)
                     if (data.playerId !== App.mySocketId){
                        $('#guessTable tr.'+row+' td.'+col).removeClass('miss').addClass('hit');
                        IO.socket.emit('hit', data, row, col);
                        for (var b = 0; b < 3; b++){
                            if(IO.isSunk(ships[b])){
                                console.log('sunk!!')
                                IO.socket.emit('sunk', data, ships[b])
                            }
                        }
                     }


                }else{
                    var changeVar = $('tr.'+row+' td.'+col);
                    console.log("player info: "+data.playerId);
                    // $('#userTable tr.'+row+' td.'+col).click(function(){$(this).css({'background-color':'black'})}); 
                    if (data.playerId !== App.mySocketId){
                        // $('#guessTable tr.'+row+' td.'+col).css({'background-color':'black'})
                        $('#guessTable tr.'+row+' td.'+col).addClass('miss');
                    } else if (data.playerId == App.mySocketId){
                        $('#userTable tr.'+row+' td.'+col).addClass('miss');
                        
                    }
                    // changeVar.css({'outline':'red solid 2px','background-color':'blue'});
                }
            }


            for (var i = 0; i < 3; i++){
            var woo = data.ships[i];
            // for(var b = 0; b < 3; b++){
            
            // for(var s = 0; s < ships.locations; s++){
            //     if(woo.locations[b] == ships[b].locations[s]){console.log('cmonnnn...')}
            //         console.log("ships from gamechange: " + woo.locations[s]);
            //     }
            // }
            console.log('change game state! row: ' + row+ " col: "+ col);
            var index = woo.locations.indexOf(row);
            //             var changeVar = $('tr.'+row+' td.'+col);
            // changeVar.css({'background-color':'black'});

                // console.log('index of shot: ' + index);
                if(woo.locations[0] == row){
                console.log("woo locations is right!");
                }
            }

            App.currentRound = App.currentRound + 1;
        },
        isSunk: function(ship){
            for (var i = 0; i < 3; i++){
                if (ship.hits[i] !== "hit"){
                    return false;
                }
            }
            return true
        },

        shipDamage : function(){
            console.log('ship damage!')
        },

        test  : function(data, row, col){
            console.log('this test worked over here!');
        },

        hit  : function(data, row, col){
            console.log('u hit it dog!!!!' + row + data);
            // var changeVar = $('tr.'+row+' td.'+col);
            

        },

        sunkShip : function(data, ship){
            socket.on('sunkship', function(ship){
                console.log(ship.typeOfBoat + ' was sunk!!')
                alert(data.message)
            })
            console.log(ship.typeOfBoat + " was sunk!")
            $('#lastShot').append("<br>"+ship.typeOfBoat + ' was sunk!!');

        },

        hitVessel : function (data, row, col){
            console.log('HITTT!!!!!!')
            if(data.playerId == App.mySocketId){
                console.log('damn bruh! i knew u were the champion!')
                $('#userTable tr.'+row+' td.'+ col).removeClass('miss').css({'background-color':'green'});
            }else{
                console.log('damn son, u just got shot')
                $('#userGuesses tr.'+row+' td.'+ col).removeClass('ship').addClass("hit");
        
            }

        },

        // miss  : function(data, row, col){
        //     console.log('u missed it dog!!!!');
        //     var changeVar = $('tr.'+row+' td.'+col);
        //    $('tr.'+row+' td.'+ col).removeClass('ship').addClass("miss");

        // },
        /**
         * A player answered. If this is the host, check the answer.
         * @param data
         */
        hostCheckAnswer : function(data) {
            if(App.myRole === 'Host') {
                App.Host.checkAnswer(data);
            }
        },

        /**
         * Let everyone know the game has ended.
         * @param data
         */
        gameOver : function(data) {
            App[App.myRole].endGame(data);
        },

        /**
         * An error has occurred.
         * @param data
         */
        error : function(data) {
            alert(data.message);
        }

    };

    var App = {

        /**
         * Keep track of the gameId, which is identical to the ID
         * of the Socket.IO Room used for the players and host to communicate
         *
         */
        gameId: 0,

        /**
         * This is used to differentiate between 'Host' and 'Player' browsers.
         */
        myRole: '',   // 'Player' or 'Host'

        /**
         * The Socket.IO socket object identifier. This is unique for
         * each player and host. It is generated when the browser initially
         * connects to the server when the page loads for the first time.
         */
        mySocketId: '',

        /**
         * Identifies the current round. Starts at 0 because it corresponds
         * to the array of word data stored on the server.
         */
        currentRound: 0,

        /* *************************************
         *                Setup                *
         * *********************************** */

        /**
         * This runs when the page initially loads.
         */
        init: function () {
            App.cacheElements();
            App.showInitScreen();
            App.bindEvents();

            // Initialize the fastclick library
            // FastClick.attach(document.body);
        },

        /**
         * Create references to on-screen elements used throughout the game.
         */
        cacheElements: function () {
            App.$doc = $(document);

            // Templates
            App.$gameArea = $('#gameArea');
            App.$templateIntroScreen = $('#intro-screen-template').html();
            App.$templateNewGame = $('#create-game-template').html();
            App.$templateJoinGame = $('#join-game-template').html();
            App.$hostGame = $('#host-game-template').html();
        },

        /**
         * Create some click handlers for the various buttons that appear on-screen.
         */
        bindEvents: function () {
            // Host
            App.$doc.on('click', '#title', App.Host.onCreateClick);

            // Player
            App.$doc.on('click', '#btnStart', App.Player.onJoinClick);
            App.$doc.on('click', '#btnStart',App.Player.onPlayerStartClick);
            App.$doc.on('click', '#userTable td',App.Player.onPlayerAnswerClick);
            App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
        },

        /* *************************************
         *             Game Logic              *
         * *********************************** */

        /**
         * Show the initial Anagrammatix Title Screen
         * (with Start and Join buttons)
         */
        showInitScreen: function() {
            App.$gameArea.html(App.$templateIntroScreen);
            // App.doTextFit('.title');
        },


        /* *******************************
           *         HOST CODE           *
           ******************************* */
        Host : {

            /**
             * Contains references to player data
             */
            players : [],

            userName: "",


            /**
             * Flag to indicate if a new game is starting.
             * This is used after the first game ends, and players initiate a new game
             * without refreshing the browser windows.
             */
            isNewGame : false,

            /**
             * Keep track of the number of players that have joined the game.
             */
            numPlayersInRoom: 0,

            /**
             * A reference to the correct answer for the current round.
             */
            currentCorrectAnswer: '',

            /**
             * Handler for the "Start" button on the Title Screen.
             */
            onCreateClick: function () {
                console.log('Clicked "Create A Game"');
                IO.socket.emit('hostCreateNewGame');
            },

            /**
             * The Host screen is displayed for the first time.
             * @param data{{ gameId: int, mySocketId: * }}
             */
            gameInit: function (data) {

                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                App.myRole = 'Host';
                // App.userName = prompt('whats your name?');
                // App.userName = data.userName;
                App.Host.numPlayersInRoom = [];
                

                console.log("Game started with ID: " + App.gameId + ' by host: ' + App.mySocketId);
            },

            /**
             * Show the Host screen containing the game URL and unique game ID
             */
            displayNewGameScreen : function(gameSize) {

                // Fill the game screen with the appropriate HTML
                console.log('display new game screen fired');
                IO.socket.emit('gameSize', gameSize);

                // // Display the URL on screen
                $('#shipsSunk').text(window.location.href);
                // App.doTextFit('#gameURL');

                // // Show the gameId / room id on screen
                $('#shotsTaken').text("game id: " + App.gameId);
            },

            /**
             * Update the Host screen when the first player joins
             * @param data{{playerName: string}}
             */
            updateWaitingScreen: function(data) {

                $('#lastShot')
                    .append('<p/>')
                    .text('Player ' + data.playerName + ' joined the game.');

                // Store the new player's data on the Host.
                App.Host.players.push(data);
                var gameSize = prompt("What size game?")

                App.Host.displayNewGameScreen(gameSize);
                // Increment the number of players in the room
                App.Host.numPlayersInRoom += 1;
                console.log("players in room: " + App.Host.numPlayersInRoom)
                App.Player.generateShipLocations(data);

                // If two players have joined, start the game!
                if (App.Host.numPlayersInRoom === 2) {
                    console.log('Room is full. Almost ready!');

                    // Let the server know that two players are present.
                    IO.socket.emit('hostRoomFull',App.gameId);
                }
            },


            // col: function(col){
            //     console.log(col);
            // },

            /**
             * Show the countdown screen
             */
            gameCountdown : function() {

                // Prepare the game screen with new HTML
                // App.$gameArea.html(App.$hostGame);
                // App.doTextFit('#hostWord');

                // Begin the on-screen countdown timer
                var $secondsLeft = $('#shipsSunk');
                App.countDown( $secondsLeft, 5, function(){
                    IO.socket.emit('hostCountdownFinished', App.gameId);
                });
            },


            /**
             * All 10 rounds have played out. End the game.
             * @param data
             */
            endGame : function(data) {
                // Get the data for player 1 from the host screen
                var $p1 = $('#player1Score');
                var p1Score = +$p1.find('.score').text();
                var p1Name = $p1.find('.playerName').text();

                // Get the data for player 2 from the host screen
                var $p2 = $('#player2Score');
                var p2Score = +$p2.find('.score').text();
                var p2Name = $p2.find('.playerName').text();

                // Find the winner based on the scores
                var winner = (p1Score < p2Score) ? p2Name : p1Name;
                var tie = (p1Score === p2Score);

                // Display the winner (or tie game message)
                if(tie){
                    $('#hostWord').text("It's a Tie!");
                } else {
                    $('#hostWord').text( winner + ' Wins!!' );
                }
                // App.doTextFit('#hostWord');

                // Reset game data
                App.Host.numPlayersInRoom = 0;
                App.Host.isNewGame = true;
            },

            /**
             * A player hit the 'Start Again' button after the end of a game.
             */
            restartGame : function() {
                App.$gameArea.html(App.$templateNewGame);
                $('#spanNewGameCode').text(App.gameId);
            }
        },



        /* *****************************
           *        PLAYER CODE        *
           ***************************** */

        Player : {

            /**
             * A reference to the socket ID of the Host
             */
            hostSocketId: '',

            /**
             * The player's name entered on the 'Join' screen.
             */
            myName: '',


            shipLength: 3,

            shipsSunk: 0,

            numShips: 3,

            /**
             * Click handler for the 'JOIN' button
             */
            onJoinClick: function () {
                console.log('Clicked "Join A Game"');

                
                socket.on('newGame', function(msg){
                    console.log('message: ' + msg);
                  });


            },

            generateShipLocations: function() {
                for (var i = 0; i < this.numShips; i++) {
                var rand1 = Math.floor(Math.random() * this.numShips);
                var rand2 = Math.floor(Math.random() * this.numShips);
                ships.push({
                    typeOfBoat: boatType[3],
                    length: boatSize[rand1], 
                    locations: ["", "", ""], 
                    hits: ["", "", ""]
                    })    
                }
                var locations;
                var shipLoca = [];
                for (var i = 0; i < 3; i++) {
                    do {
                        locations = this.generateShip();
                    } while (console.log('generating ships...'));
                    ships[i].locations = locations;
                    // shipLoca.push(ships[i].locations);


                    console.log("New ship location: "+ships[i].locations)
                    IO.socket.emit('shipGenerator', ships[i].locations);
                    var loca = ships[i].locations[0];
                    var row = loca[0];
                    var col = loca[2];
                    // console.log(shipLoca.locations)
                }
            },

            generateShip: function() {
                var direction = Math.floor(Math.random() * 2);
                var row, col;

                if (direction === 1) { // horizontal
                    row = Math.floor(Math.random() * 9);
                    col = Math.floor(Math.random() * (9 - this.shipLength + 1));
                } else { // vertical
                    row = Math.floor(Math.random() * (9 - this.shipLength + 1));
                    col = Math.floor(Math.random() * 9);
                }

                var newShipLocations = [];
                for (var i = 0; i < this.shipLength; i++) {
                    if (direction === 1) {
                        newShipLocations.push(row + " " + (col + i));
                    } else {
                        var vert = row + i;
                        newShipLocations.push((row + i) + " " + col);
                    }
                }
                return newShipLocations;
                console.log(newShipLocations)
            },

            /**
             * The player entered their name and gameId (hopefully)
             * and clicked Start.
             */
            onPlayerStartClick: function() {

                // collect data to send to the server
                var data = {
                    gameId : +($('#inputGameId').val()),
                    playerName : $('#inputPlayerName').val() || 'anon'
                };

                // App.Host.displayNewGameScreen(gameSize);

                // Send the gameId and playerName to the server
                IO.socket.emit('playerJoinGame', data);
                // IO.socket.emit('newGame', data);
                
                // Set the appropriate properties for the current player.
                App.myRole = 'Player';
                App.Player.myName = data.playerName;
                App.Player.generateShipLocations(data);
            },


            /**
             *  Click handler for the Player hitting a word in the word list.
             */
            onPlayerAnswerClick: function() {
                console.log('Clicked Answer Button');
                // App.currentRound = App.currentRound + 1;
                console.log(App.currentRound);
                console.log(ships)

                var $btn = $(this);      // the tapped button
                // var answer = $btn.val(); 
                   var row = $btn.parent().attr('class');
                   var col = $btn.attr('class');
                   console.log('row class: ' + row)
                   console.log('col class: ' + col)
                    console.log("current round: "+App.currentRound);
                   // $(this).addClass('.hit');

                // Send the player info and tapped word to the server so
                // the host can check the answer.
                


                var data = {
                    gameId: App.gameId,
                    playerId: App.mySocketId,
                    answer: row + " " + col,
                    row: row,
                    col: col,
                    round: App.currentRound,
                    userName: App.userName,
                    ships: ships
                }

                // IO.socket.emit('playerAnswer', data);
                IO.socket.emit('hitShip', data, data.playerId, data.row, data.col, App.myRole);
                IO.socket.emit('test', data, data.row, data.col);
                socket.on('hitShip', function(msg){
                        // data.round++;
                        console.log("current round: "+ msg[0]);
                });

                // socket.emit('guess', data.col, data.row);

                socket.on('guess', function(col, row){

                        for(var i = 0; i < ships.length; i++){
                            for(var b = 0;b < ships.length; b ++)
                            var hit = ships[i].locations[b];
                            // console.log("current boats for guesses: "+ hit)
                            if(ships[i].locations[b] == col + " " + row){
                                console.log('boom!!!')
                            }
                        }
                            console.log("row on guess: " + row);
                });
            },


            /**
             *  Click handler for the "Start Again" button that appears
             *  when a game is over.
             */
            onPlayerRestart : function() {
                var data = {
                    gameId : App.gameId,
                    playerName : App.Player.myName
                }
                IO.socket.emit('playerRestart',data);
                App.currentRound = 0;
                $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
            },

            /**
             * Display the waiting screen for player 1
             * @param data
             */
            updateWaitingScreen : function(data) {
                if(IO.socket.socket.sessionid === data.mySocketId){
                    App.myRole = 'Player';
                    App.gameId = data.gameId;

                    $('#playerWaitingMessage')
                        .append('<p/>')
                        .text('Joined Game ' + data.gameId + '. Please wait for game to begin.');


                }
            },

            /**
             * Display 'Get Ready' while the countdown timer ticks down.
             * @param hostData
             */
            gameCountdown : function(hostData) {
                App.Player.hostSocketId = hostData.mySocketId;
                $('#gameArea')
                    .html('<div class="gameOver">Get Ready!</div>');
                $('tr.1').css({'background-color':'yellow'});

                // App.Host.displayNewGameApp.gameSize
            },

            /**
             * Show the "Game Over" screen.
             */
            endGame : function() {
                $('#gameArea')
                    .html('<div class="gameOver">Game Over!</div>')
                    .append(
                        // Create a button to start a new game.
                        $('<button>Start Again</button>')
                            .attr('id','btnPlayerRestart')
                            .addClass('btn')
                            .addClass('btnGameOver')
                    );
            }
        },


        /* **************************
                  UTILITY CODE
           ************************** */

        /**
         * Display the countdown timer on the Host screen
         *
         * @param $el The container element for the countdown timer
         * @param startTime
         * @param callback The function to call when the timer ends.
         */
        countDown : function( $el, startTime, callback) {

            // Display the starting time on the screen.
            $el.text(startTime);
            // App.doTextFit('#hostWord');

            console.log('Starting Countdown...');

            // Start a 1 second timer
            var timer = setInterval(countItDown,1000);

            // Decrement the displayed timer value on each 'tick'
            function countItDown(){
                startTime -= 1
                $el.text(startTime);
                // App.doTextFit('#hostWord');

                if( startTime <= 0 ){
                    console.log('Countdown Finished.');

                    // Stop the timer and do the callback.
                    clearInterval(timer);
                    callback();
                    return;
                }
            }

        }
    };

    IO.init();
    App.init();

}($));
