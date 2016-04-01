var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var root = __dirname + "/public";
var accountSID = 'AC9f14a9f2f0055718cb19a493809b9a6c';
var authToken = 'cd0a3a1c70c130d65b84a0778a8b80db'
var twilio = require('twilio')(accountSID, authToken);
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);

// -------------------------------------------------------------
// SET UP PUSHER
// -------------------------------------------------------------
var Pusher = require("pusher");
var pusher = new Pusher({
    appId: "194078",
    key: "50a5ee77cd4b95ea7074",
    secret: "684ecbc0113f55c6a464"
});

// -------------------------------------------------------------
// SET UP EXPRESS
// -------------------------------------------------------------

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// /* GET home page. */
// router.get('/', function(req, res) {
// });

io.on('connection', function(socket) {
    socket.on('join', function(room) {
        var clients = io.sockets.adapter.rooms[room];
        var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;
        if (numClients == 0) {
            socket.join(room)
            console.log('1 peep in room');
        } else {
            socket.join(room);
            console.log('2 peeps in room');
            socket.emit('ready', room);
            socket.broadcast.emit('ready', room);
        }
    });

    socket.on('token', function() {
        twilio.tokens.create(function(err, response) {
            if (err) {
                console.log(err);
            } else {
                socket.emit('token', response);
            }
        });
    });

    socket.on('candidate', function(candidate) {
        socket.broadcast.emit('candidate', candidate);
    });

    socket.on('offer', function(offer) {
        socket.broadcast.emit('offer', offer);
    });
    
    socket.on('answer', function(answer){
        socket.broadcast.emit('answer', answer);
    });
});

// Open server on specified port
console.log("Starting Express server");
server.listen(process.env.PORT || 5001);

module.exports = app;