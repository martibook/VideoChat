const CREATED = "created";
const JOIN = "join";
const JOINED = "joined";
const FULL = "full";

const READY = "ready";
const CANDIDATE = "candidate";
const OFFER = "offer";
const ANSWER = "answer";

const SELF_MEDIA_OPTION = { audio: false, video: { width: 1080, height: 720 } };

let socket = io.connect("http://localhost:4000");
let divVideoChatLobby = document.getElementById("video-chat-lobby");
let divVideoChat = document.getElementById("video-chat-room");
let joinButton = document.getElementById("join");
let switchButton = document.getElementById("switch");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");
let roomInput = document.getElementById("roomName");
let roomName;
let creator = false;
let rtcPeerConnection;
let userStream;
let videoOn = true;

let iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

joinButton.addEventListener("click", function () {
  if (roomInput.value == "") {
    alert("Please input a room name!");
  } else {
    socket.emit(JOIN, roomInput.value);
    divVideoChatLobby.style = "display:none";
    divVideoChat.style = "display:flex";
  }
});

switchButton.addEventListener("click", function() {
  videoOn = !videoOn;
  if (videoOn) {
    switchButton.textContent = "Turn Off Video";
    if (userStream.getTracks()) {
      userStream.getTracks()[0].enabled = true;
    }
  }
  else {
    switchButton.textContent = "Turn On Video";
    if (userStream.getTracks()) {
      userStream.getTracks()[0].enabled = false;
    }
  }
})

function getUserMedia(afterGetUserMedia) {
  navigator.mediaDevices
    .getUserMedia(SELF_MEDIA_OPTION)
    .then(afterGetUserMedia)
    .catch((err) => {
      alert(`Error occurred: ${err.name}`);
    });
}

socket.on(CREATED, (roomName) => {
  getUserMedia((stream) => {
    userStream = stream;
    userVideo.srcObject = stream;
    userVideo.onloadedmetadata = (e) => {
      userVideo.play();
    };
  });
});

socket.on(JOINED, (roomName) => {
  getUserMedia((stream) => {
    userStream = stream;
    userVideo.srcObject = stream;
    userVideo.onloadedmetadata = (e) => {
      userVideo.play();
    };
    // After we self joined the room, we emit "ready" to our partners
    socket.emit(READY, roomInput.value);
  });
});

socket.on(FULL, () => {
  alert(`Room is full, can not join anymore`);
});

socket.on(READY, (roomName) => {
  console.log(`Another user is ready in the room`);

  rtcPeerConnection = new RTCPeerConnection(iceServers);
  rtcPeerConnection.onicecandidate = onIceCandidate;
  rtcPeerConnection.ontrack = onTrack;
  rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
  rtcPeerConnection.createOffer(
    (offer) => {
      rtcPeerConnection.setLocalDescription(offer);
      socket.emit(OFFER, offer, roomInput.value);
    },
    (err) => {
      console.log(`Creating offer encounters error ${err}`);
    }
  );
});

socket.on(CANDIDATE, (candidate) => {
  let rtcIceCandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(rtcIceCandidate);
});

socket.on(OFFER, (offer) => {
  rtcPeerConnection = new RTCPeerConnection(iceServers);
  rtcPeerConnection.onicecandidate = onIceCandidate;
  rtcPeerConnection.ontrack = onTrack;
  rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
  rtcPeerConnection.setRemoteDescription(offer);
  rtcPeerConnection.createAnswer(
    (answer) => {
      rtcPeerConnection.setLocalDescription(answer);
      socket.emit(ANSWER, answer, roomInput.value);
    },
    (err) => {
      console.log(`Creating answer encounters error ${err}`);
    }
  );
});

socket.on(ANSWER, (answer) => {
  rtcPeerConnection.setRemoteDescription(answer);
});

function onIceCandidate(event) {
  console.log(`event from STUN server ${event}`);
  if (event.candidate) {
    socket.emit(CANDIDATE, event.candidate, roomInput.value);
  }
}

function onTrack(event) {
  peerVideo.srcObject = event.streams[0];
  peerVideo.onloadedmetadata = (e) => {
    peerVideo.play();
  };
}
