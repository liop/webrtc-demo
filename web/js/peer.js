'use strict';

var localStream = null;
var remoteStream = null;
var startButton = document.getElementById('startButton');
var callButton = document.getElementById('callButton');
var hangupButton = document.getElementById('hangupButton');

var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');
var logList = document.getElementById('logs');
var loading = document.getElementById('loading');

var pc1 = null;

// var turnReady;

var pcConfig = {
  'iceServers': [{
    'url': 'stun:stun.l.google.com:19302',
  },
  { "url": "stun:stun.l.google.com:19302" }]
};

var isInitiator;

startButton.onclick= start;
callButton.onclick= call;
hangupButton.onclick = hangup;

callButton.disabled = true;
hangupButton.disabled = true;

window.room = prompt("Enter room name:");

var socket = io.connect();

if (room !== "") {
  track('准备进入房间 '+room);
  socket.emit('create or join', room);
}

socket.on('connect', function() {
  track("连接成功 " + socket.id); // 'G5p5...'
});

socket.on('created', function(room, clientId) {
  isInitiator = true;
  track('创建房间' + room + ' 成功');
});

socket.on('full', function(room) {
  track('加入房间' + room + '失败，房间已满');
});

socket.on('ipaddr', function(ipaddr) {
  track('Message from client: Server IP address is ' + ipaddr);
});

socket.on('joined', function(room, clientId) {
  isInitiator = false;
  track('加入房间' + room + ' 成功');
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

socket.on('message', async function(signal) {
  if (signal.type === 'icecandidate') {
    if (!pc1) {
      await start();
    }
    if (signal.candidate) {
      pc1.addIceCandidate(new RTCIceCandidate({
        candidate: signal.candidate,
        sdpMLineIndex: signal.sdpMLineIndex
      }))
      .then(function(event){ track('addIceCandidate sucess', event)})
      .catch(function(event){ track('addIceCandidate failure ', event)})
    }
  } else if (signal.type === 'offer') {
    if (!pc1) {
      await start();
    }
    if (window.confirm('收到视频电话，是否接受？')) {
      callButton.disabled = true;
      hangup.disabled = false;
      pc1.setRemoteDescription(new RTCSessionDescription(signal))
      .then(function(event){ track(pc1, 'setRemoteDescription sucess', event)})
      .catch(function(event){ track(pc1, 'setRemoteDescription failure ', event)})
      pc1.createAnswer()
      .then(function(sessionDescription) {
        track(pc1, 'createAnswer success', sessionDescription);
        pc1.setLocalDescription(sessionDescription);
        socket.emit("message", { type: 'answer', sdp: sessionDescription.sdp });
      }).catch(function(event){
        track(pc1, 'createAnswer failure',event);
      });
    }
  } else if (signal.type === 'answer') {
    pc1.setRemoteDescription(new RTCSessionDescription(signal))
    .then(function(event){ track(pc1, 'setRemoteDescription sucess', event)})
    .catch(function(event){ track(pc1, 'setRemoteDescription failure ', event)})
  } else if (signal === 'bye') {
    hangup();
  }
});

if (location.hostname !== 'localhost') {
  requestTurn(
    'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  );
}

function start() {
  return navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  }).then(function(stream) {
    localVideo.srcObject = stream;
    window.stream = localStream = stream;
    callButton.disabled = false;
    
    pc1 = createPeerConnection();
    
    pc1.addStream(localStream);
    pc1.onaddstream = function(event) {
      if (!event) return;
      remoteStream = stream;
      remoteVideo.src = window.URL.createObjectURL(event.stream);
    }

  }).catch(function(e) {
    alert('getUserMedia() error: ' + e.name);
  });
}


function createPeerConnection() {
  var pc = new RTCPeerConnection(pcConfig);
  pc.onicecandidate = function(event) {
    if (!pc || !event || !event.candidate) return;
    var candidate = event.candidate;
    socket.emit("message", {
      type: 'icecandidate',
      candidate: candidate.candidate,
      sdpMLineIndex: candidate.sdpMLineIndex
    });
  };
  return pc;
}


function waitUntilRemoteStreamStartsFlowing()
{
    if (!(remoteVideo.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA 
        || remoteVideo.paused || remoteVideo.currentTime <= 0)) 
    {
        track('loading video ...');
    } 
    else setTimeout(waitUntilRemoteStreamStartsFlowing, 50);
}

function call() {
  callButton.disabled = true;
  hangupButton.disabled = false;

  track('正在呼叫');

  

  pc1.createOffer({
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  }).then(function(sessionDescription) {
    track(pc1, 'createOffer sucess');
    pc1.setLocalDescription(sessionDescription)
    .then(function(event){ track(pc1, 'setLocalDescription sucess', event)})
    .catch(function(event){ track(pc1, 'setLocalDescription failure ', event)})

    socket.emit("message",  {
      type: 'offer',
      sdp: sessionDescription.sdp
    });
  },function(event) {
    track(pc1, 'createOffer failure', event);
  });
}


function sendMessage() {
  dataChannel.send()
}
function hangup() {
  callButton.disabled = true;
  startButton.disabled = false;
  hangupButton.disabled = true;
  pc1.close();
  track('hangup');
  socket.emit('message', 'bye');
}

/* to: RTCPeerConnection
signal: {
  type: 'icecandidate' || 'offer' || 'answer' }
  event: orign event

*/

function track(pc, text) {
  var log = '';
  if (text) {
    log = '[pc]: ' + text;
  } else {
    log = pc;
  }
  console.log(log);
  logList.textContent = log  + '\n'+ logList.textContent;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function requestTurn(turnURL) {
  var turnExists = false;
  for (var i in pcConfig.iceServers) {
    if (pcConfig.iceServers[i].url.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        pcConfig.iceServers.push({
          'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
}
