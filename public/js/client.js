var socket = io('http://localhost:3000');
var nickname = prompt("Enter a nickname");
$('form').submit(function() {
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    return false;
});
socket.on('chat message', function(msg) {
    $('#messages').append($('<li>').text(msg));
});
socket.on('welcome', function(msg) {
    $('#messages').append($('<li>').text(msg));
});
socket.on('goodbye', function(msg) {
    $('#messages').append($('<li>').text(msg));
});
