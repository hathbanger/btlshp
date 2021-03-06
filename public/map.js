
var socket = io.connect();


  socket.on('gameSize', function(gameSize){
  				var gameSize = gameSize;
  		        var w = $(window).height();
                var y = 0;
                var table = $('table');
                function addMap(rows){
                    var colHolder = "";
                    maker(rows);
                    function maker(rows){
                        var rowCount = 0;
                        for (var x = 0 ; x < rows; x++){
                            var rowNum = '<tr class="' + x + '">' + columnMaker(rows) + '</tr>';
                            table.append(rowNum);
                            rowCount = rowCount + 1;
                        };
                        function columnMaker(rows){
                            while(y < rows){
                             colHolder += '<td class="'+y+'"></td>'; 
                                y = y + 1;
                            }
                            return colHolder;
                        };
                };
 };
                // Map generator waits for gameSize to be determined by host and commited by player..
                addMap(gameSize)



                // paint the checkers on the boards
                var td = $('td');
                var ch = w / gameSize;
                $('td').css({'height': ch-20,'width': ch});


                // paint the checkers on the boards
                if (gameSize % 2 == 0){
                    $('tr td:even').css({'background-color':'#446CB3'});
                    $('tr td:odd').css({'background-color':'#22313F'});
                } else {

                    $('tr td:even').css({'background-color':'#446CB3'});
                    $('tr td:odd').css({'background-color':'#22313F'});
                }

                // iterate through and paint ships grey with .ship class
                for(var i = 0; i < ships.length; i++){
                    var specificLocations = ships[i].locations;
                    for(var v = 0; v < ships.length; v++){
                      var split = specificLocations[v];
                      var row = split[0];
                      var col = split[2];
                      var changeVar = $('#guessTable tr.'+row+' td.'+col);
                      changeVar.addClass('ship');
                      // console.log('even more specifically: ' + row[0])
                    }
                };
                  // var sound = new Howl({
                  //   urls: ['audio/click.wav'],
                  //   volume: [.5]
                  // })

                  // var hoverState = 0;

                  // $('#userTable td').mouseover(function(){
                  //   hoverState++;
                  //   if (hoverState == 1){
                  //     sound.play();
                  //     hoverState =0;
                  //   }
                  // });

  });
