// app.js
var VideoChat = {
    socket: io('https://blueberry-cobbler-31135.herokuapp.com:80'),

    requestMediaStream: function(event) {
        getUserMedia(
            { video: true, audio: true },
            VideoChat.onMediaStream,
            VideoChat.noMediaStream
        );
    },

    onMediaStream: function(stream) {
        VideoChat.localVideo = document.getElementById('local-video');
        VideoChat.localVideo.volume = 0;
        VideoChat.localStream = stream;
        VideoChat.videoButton.setAttribute('disabled', 'disabled');
        var streamUrl = window.URL.createObjectURL(stream);
        VideoChat.localVideo.src = streamUrl;
        VideoChat.socket.emit('join', 'test');
        VideoChat.socket.on('ready', VideoChat.readyToCall);
        VideoChat.socket.on('offer', VideoChat.onOffer);
    },

    noMediaStream: function() {
        console.log("No media stream for us.");
    },

    readyToCall: function(event) {
        console.log("Ready to call");
        VideoChat.callButton.removeAttribute('disabled');
    },

    startCall: function(event) {
        VideoChat.socket.on('token', VideoChat.onToken(VideoChat.createOffer));
        VideoChat.socket.emit('token');
    },

    onToken: function(callback) {
        return function(token) {
            VideoChat.peerConnection = new RTCPeerConnection({
                iceServers: token.iceServers
            });

            VideoChat.peerConnection.addStream(VideoChat.localStream);
            VideoChat.peerConnection.onicecandidate = VideoChat.onIceCandidate;
            VideoChat.peerConnection.onaddstream = VideoChat.onAddStream;
            VideoChat.socket.on('candidate', VideoChat.onCandidate);
            VideoChat.socket.on('answer', VideoChat.onAnswer);
            callback();
        }
    },

    onIceCandidate: function(event) {
        if (event.candidate) {
            console.log('Generated candidate!');
            VideoChat.socket.emit('candidate', JSON.stringify(event.candidate));
        }
    },

    onCandidate: function(candidate) {
        rtcCandidate = new RTCIceCandidate(JSON.parse(candidate));
        VideoChat.peerConnection.addIceCandidate(rtcCandidate);
    },

    createOffer: function() {
        VideoChat.peerConnection.createOffer(
            function(offer) {
                VideoChat.peerConnection.setLocalDescription(offer);
                VideoChat.socket.emit('offer', JSON.stringify(offer));
            },
            function(err) {
                console.log(err);
            }
        );
    },

    createAnswer: function(offer) {
        return function() {
            rtcOffer = new RTCSessionDescription(JSON.parse(offer));
            VideoChat.peerConnection.setRemoteDescription(rtcOffer);
            VideoChat.peerConnection.createAnswer(
                function(answer) {
                    VideoChat.peerConnection.setLocalDescription(answer);
                    VideoChat.socket.emit('answer', JSON.stringify(answer));
                },
                function(err) {
                    console.log(err);
                }
            );
        }
    },

    onOffer: function(offer) {
        VideoChat.socket.on('token', VideoChat.onToken(VideoChat.createAnswer(offer)));
        VideoChat.socket.emit('token');
    },

    onAnswer: function(answer) {
        var rtcAnswer = new RTCSessionDescription(JSON.parse(answer));
        VideoChat.peerConnection.setRemoteDescription(rtcAnswer);
    },

    onAddStream: function(event) {
        VideoChat.remoteVideo = document.getElementById('remote-video');
        VideoChat.remoteVideo.src = window.URL.createObjectURL(event.stream);
    }
};

VideoChat.videoButton = document.getElementById('get-video');

// app.js
VideoChat.callButton = document.getElementById('call');

VideoChat.callButton.addEventListener(
    'click',
    VideoChat.startCall,
    false
);

VideoChat.videoButton.addEventListener(
    'click',
    VideoChat.requestMediaStream,
    false
);
