// Initialise DataChannel.js
var datachannel = new DataChannel();

// Set the userid based on what has been defined by DataChannel
datachannel.userid = window.userid;

// Open a connection to Pusher
var pusher = new Pusher("PUSHER_APP_KEY");

// Storage of Pusher connection socket ID
var socketId;

// Pusher.log = function(message) {
//   if (window.console && window.console.log) {
//     window.console.log(message);
//   }
// };

// Monitor Pusher connection state
pusher.connection.bind("state_change", function(states) {
    switch (states.current) {
        case "connected":
            socketId = pusher.connection.socket_id;
            break;
        case "disconnected":
        case "failed":
        case "unavailable":
            break;
    }
});

// Set custom Pusher signalling channel
datachannel.openSignalingChannel = function(config) {
    var channel = config.channel || this.channel || "default-channel";
    var xhrErrorCount = 0;

    var socket = {
        send: function(message) {
            $.ajax({
                type: "POST",
                url: "/message",
                data: {
                    socketId: socketId,
                    channel: channel,
                    message: message
                },
                timeout: 1000,
                success: function(data) {
                    xhrErrorCount = 0;
                },
                error: function(xhr, type) {
                    // Increase XHR error count
                    xhrErrorCount++;

                    // Stop sending signaller messages if it's down
                    if (xhrErrorCount > 5) {
                        console.log("Disabling signaller due to connection failure");
                        datachannel.transmitRoomOnce = true;
                    }
                }
            });
        },
        channel: channel
    };

    // Subscribe to Pusher signalling channel
    var pusherChannel = pusher.subscribe(channel);

    // Call callback on successful connection to Pusher signalling channel
    pusherChannel.bind("pusher:subscription_succeeded", function() {
        if (config.callback) config.callback(socket);
    });

    // Proxy Pusher signaller messages to DataChannel
    pusherChannel.bind("message", function(message) {
        config.onmessage(message);
    });

    return socket;
};