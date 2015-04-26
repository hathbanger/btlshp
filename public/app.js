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
            IO.socket.on('hitVessel', IO.hitVessel);
            IO.socket.on('sunkShip', IO.sunkShip);
            IO.socket.on('message', IO.roomLabel);
            IO.socket.on('roomLabel', IO.roomLabel);
            IO.socket.on('gameChange', IO.gameChange);            
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

        gameChange : function(data, row, col){
            // this is the location of the opponents shot..
            var hisShot =  row + " " + col;
            // iterate through the ships to check of the location is a hit..
            for(var k = 0; k < 3; k++){
                var index = ships[k].locations.indexOf(hisShot);
                if(index >= 0){
                    ships[k].hits[index] = "hit";
                    console.log(ships[k].hits)
                    if (data.playerId !== App.mySocketId){
                        $('#guessTable tr.'+row+' td.'+col).removeClass('miss').addClass('hit animate');
                        IO.socket.emit('hit', data, row, col);
                            if(IO.isSunk(ships[k])){
                                alert('Your '+ships[k].typeOfBoat+' has been sunk!')
                                IO.socket.emit('sunk', data, ships[k])
                                console.log('total ships sunk: ' + App.Player.shipsSunk)
                        }
                     }

                }else{
                    console.log("player info: "+data.playerId);
                    if (data.playerId !== App.mySocketId){
                        if(ships[k].locations.indexOf(hisShot) < 0){
                            $('#guessTable tr.'+row+' td.'+col).removeClass('ship').addClass('miss');
                        }else{
                           $('#guessTable tr.'+row+' td.'+col).removeClass('miss ship').addClass('hit'); 
                        }
                    } else if (data.playerId == App.mySocketId){
                        $('#userTable tr.'+row+' td.'+col).addClass('miss reveal');
                    }
                }
            }
            App.currentRound = App.currentRound + 1;
            console.log("current round: "+App.currentRound);
        },

        // function to see if ship in question has been sunk
        isSunk: function(ship){
            for (var i = 0; i < 3; i++){
                if (ship.hits[i] !== "hit"){
                    return false;
                }
            }
            return true
        },

        //Add new rooms to top menu 
        roomLabel : function(roomData){
            console.log('heres the room data! '+roomData.length)
            for(var i = 0; i < roomData.length;i++){
                $('#roomStack').html("<a href="+'#' +">" + roomData[i] + "</a>");
            }
        },

        sunkShip : function(data, ship){
            App.Player.shipsSunk++;
            console.log("total ships sunk! "+App.Player.shipsSunk)
            socket.on('sunkship', function(ship){
                alert(ship.typeOfBoat + ' was sunk!!')
            })
            if(data.playerId !== App.mySocketId){
                $('.fa-times:nth-child('+App.Player.shipsSunk+')').addClass('damageSus');
            }else{
                $('.fa-ship:nth-child('+App.Player.shipsSunk+')').addClass('sendDam');
            }
            if(App.Player.shipsSunk >= 3){
                alert('Game over!')
            }
                

        },

        hitVessel : function (data, row, col){
            console.log('HITTT!!!!!!')
            if(data.playerId == App.mySocketId){
                console.log('damn bruh! i knew u were the champion!')
                $('#userTable tr.'+row+' td.'+ col).removeClass('miss').addClass('damage animate').animate({'transform':'rotate(1080deg)'})
                $('li .shipIcon:first').css({'color':'black'})
            }else{
                console.log('damn son, u just got shot')

            }

        },

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
        // gameOver : function(data) {
        //     App[App.myRole].endGame(data);
        // },

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


        gameSize: 0,

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
            // App.showInitScreen();
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
            // App.$gameArea = $('#gameArea');
            // App.$templateNewGame = $('#create-game-template').html();
            // App.$templateJoinGame = $('#join-game-template').html();
            // App.$hostGame = $('#host-game-template').html();
        },

        /**
         * Create some click handlers for the various buttons that appear on-screen.
         */
        bindEvents: function () {
            // Host
            App.$doc.on('click', '#title', App.Host.onCreateClick);

            // Player
            // App.$doc.on('click', '#btnStart', App.Player.onJoinClick);
            App.$doc.on('click', '#roomStack a',App.Player.onPlayerStartClick);
            App.$doc.on('click', '#userTable td',App.Player.onPlayerAnswerClick);
            // App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
        },

        /* *************************************
         *             Game Logic              *
         * *********************************** */

        /**
         * Show the initial Anagrammatix Title Screen
         * (with Start and Join buttons)
         */
        // showInitScreen: function() {
        //     // App.$gameArea.html(App.$templateIntroScreen);
        //     // App.doTextFit('.title');
        // },


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
                var gameSize = prompt('What sized game?')
                IO.socket.emit('hostCreateNewGame', gameSize);
            },

            /**
             * The Host screen is displayed for the first time.
             * @param data{{ gameId: int, mySocketId: * }}
             */
            gameInit: function (data) {

                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                App.myRole = 'Host';
                App.gameSize = data.gameSize;
                // App.userName = prompt('whats your name?');
                // App.userName = data.userName;
                App.Host.numPlayersInRoom = [];
                
                console.log("Game started with ID: " + App.gameId + ' by host: ' + App.mySocketId + " with gamesize: "+ App.gameSize);
            },

            /**
             * Show the Host screen containing the game URL and unique game ID
             */
            displayNewGameScreen : function(gameSize) {
                // Fill the game screen with the appropriate HTML
                console.log('display new game screen fired');
                IO.socket.emit('sizeInfo', gameSize);
                // // Display the URL on screen
                $('#roomStack').prepend(window.location.href + " >>   ");
                // App.doTextFit('#gameURL');
                // // Show the gameId / room id on screen
                $('#shotsTaken').text("game id: " + App.gameId);
            },

            /**
             * Update the Host screen when the first player joins
             * @param data{{playerName: string}}
             */
            updateWaitingScreen: function(data) {
                // Store the new player's data on the Host.
                App.Host.players.push(data);
                var gameSize = App.gameSize;

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
            // gameCountdown : function() {

            //     // Prepare the game screen with new HTML
            //     // App.$gameArea.html(App.$hostGame);
            //     // App.doTextFit('#hostWord');

            //     // Begin the on-screen countdown timer
            //     var $secondsLeft = $('#shipsSunk');
            //     App.countDown( $secondsLeft, 5, function(){
            //         IO.socket.emit('hostCountdownFinished', App.gameId);
            //     });
            // },


            /**
             * All 10 rounds have played out. End the game.
             * @param data
             */
            // endGame : function(data) {
            //     // Get the data for player 1 from the host screen
            //     var $p1 = $('#player1Score');
            //     var p1Score = +$p1.find('.score').text();
            //     var p1Name = $p1.find('.playerName').text();

            //     // Get the data for player 2 from the host screen
            //     var $p2 = $('#player2Score');
            //     var p2Score = +$p2.find('.score').text();
            //     var p2Name = $p2.find('.playerName').text();

            //     // Find the winner based on the scores
            //     var winner = (p1Score < p2Score) ? p2Name : p1Name;
            //     var tie = (p1Score === p2Score);

            //     // Display the winner (or tie game message)
            //     if(tie){
            //         $('#hostWord').text("It's a Tie!");
            //     } else {
            //         $('#hostWord').text( winner + ' Wins!!' );
            //     }
            //     // App.doTextFit('#hostWord');

            //     // Reset game data
            //     App.Host.numPlayersInRoom = 0;
            //     App.Host.isNewGame = true;
            // },

            /**
             * A player hit the 'Start Again' button after the end of a game.
             */
            restartGame : function() {
                // App.$gameArea.html(App.$templateNewGame);
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
            // onJoinClick: function () {
            //     console.log('Clicked "Join A Game"');

                
            //     socket.on('newGame', function(msg){
            //         console.log('message: ' + msg);
            //       });


            // },

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

            addGame : function (){
                console.log('woo! working addgame working...')
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
                if(ships.length == 0){
                // collect data to send to the server
                var data = {
                    gameId : +($(this).text()),
                    playerName : $('#inputPlayerName').val() || 'anon'
                };

                // Send the gameId and playerName to the server
                IO.socket.emit('playerJoinGame', data);
                // IO.socket.emit('newGame', data);
                
                // Set the appropriate properties for the current player.
                App.myRole = 'Player';
                App.Player.myName = data.playerName;
                App.Player.generateShipLocations(data);
                }else{
                    console.log('woah broh, stop hittin that button')
                }
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
                socket.on('hitShip', function(msg){
                        // data.round++;
                        console.log("current round: "+ msg[0]);
                });

                // socket.emit('guess', data.col, data.row);
            },

            // roomFeed    :  function (data){
            //     console.log('room feed fired...' + data)
            // },

            /**
             *  Click handler for the "Start Again" button that appears
             *  when a game is over.
             */
            // onPlayerRestart : function() {
            //     var data = {
            //         gameId : App.gameId,
            //         playerName : App.Player.myName
            //     }
            //     IO.socket.emit('playerRestart',data);
            //     App.currentRound = 0;
            //     $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
            // },

            /**
             * Display the waiting screen for player 1
             * @param data
             */
            updateWaitingScreen : function(data) {
                if(IO.socket.socket.sessionid === data.mySocketId){
                    App.myRole = 'Player';
                    App.gameId = data.gameId;
                }
            },

            /**
             * Display 'Get Ready' while the countdown timer ticks down.
             * @param hostData
             */
            // gameCountdown : function(hostData) {
            //     App.Player.hostSocketId = hostData.mySocketId;
            //     $('#gameArea')
            //         .html('<div class="gameOver">Get Ready!</div>');
            //     $('tr.1').css({'background-color':'yellow'});

            //     // App.Host.displayNewGameApp.gameSize
            // },

            /**
             * Show the "Game Over" screen.
             */
        //     endGame : function() {
        //         $('#gameArea')
        //             .html('<div class="gameOver">Game Over!</div>')
        //             .append(
        //                 // Create a button to start a new game.
        //                 $('<button>Start Again</button>')
        //                     .attr('id','btnPlayerRestart')
        //                     .addClass('btn')
        //                     .addClass('btnGameOver')
        //             );
        //     }
        // },


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
        // countDown : function( $el, startTime, callback) {

        //     // Display the starting time on the screen.
        //     $el.text(startTime);
        //     // App.doTextFit('#hostWord');

        //     console.log('Starting Countdown...');

        //     // Start a 1 second timer
        //     var timer = setInterval(countItDown,1000);

        //     // Decrement the displayed timer value on each 'tick'
        //     function countItDown(){
        //         startTime -= 1
        //         $el.text(startTime);
        //         // App.doTextFit('#hostWord');

        //         if( startTime <= 0 ){
        //             console.log('Countdown Finished.');

        //             // Stop the timer and do the callback.
        //             clearInterval(timer);
        //             callback();
        //             return;
        //         }
        //     }

        }
    };

    IO.init();
    App.init();

}($));
