const welcome = document.getElementById("welcome");
const rolePopup = document.getElementById("rolePopup");
const createPopup = document.getElementById("createPopup");
const joinPopup = document.getElementById("joinPopup");
const videoInterface = document.getElementById("videoInterface");

const startCallingBtn = document.getElementById("startCallingBtn");
const startBtn = document.getElementById("startBtn");
const connectBtn = document.getElementById("connectBtn");
const toggleVideoBtn = document.getElementById("toggleVideoBtn");
const toggleAudioBtn = document.getElementById("toggleAudioBtn");
const endCallBtn = document.getElementById("endCallBtn");

const myIdInput = document.getElementById("myId");
const connectToInput = document.getElementById("connectTo");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let peer = null;
let localStream = null;
let currentCall = null;

// Show role selection popup
startCallingBtn.addEventListener("click", () => {
  welcome.style.display = "none";
  rolePopup.classList.remove("hidden");
});

// Role selection
function chooseRole(role) {
  rolePopup.classList.add("hidden");

  if (role === "create") {
    const id = generateId();
    myIdInput.value = id;

    peer = new Peer(id);
    peer.on("open", () => console.log("Peer opened with ID:", id));

    peer.on("call", (call) => {
      getLocalStream().then((stream) => {
        call.answer(stream);
        setupLocalStream(stream);
        call.on("stream", (remoteStream) => {
          remoteVideo.srcObject = remoteStream;
        });
        currentCall = call;
        showVideoInterface();
      });
    });

    createPopup.classList.remove("hidden");
  } else {
    peer = new Peer();
    peer.on("open", (id) => {
      console.log("Joining as peer with ID:", id);
    });
    joinPopup.classList.remove("hidden");
  }
}

// Generate random ID
function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// Copy Call ID
function copyId() {
  navigator.clipboard.writeText(myIdInput.value);
  alert("Call ID copied!");
}

// Start call (for Create)
startBtn.addEventListener("click", () => {
  createPopup.classList.add("hidden");
  // Wait for incoming call
  alert("Waiting for another user to join using this ID.");
});

// Join Call
connectBtn.addEventListener("click", () => {
  const id = connectToInput.value.trim();
  if (!id) return alert("Please enter a valid Call ID");

  getLocalStream().then((stream) => {
    setupLocalStream(stream);
    const call = peer.call(id, stream);

    call.on("stream", (remoteStream) => {
      remoteVideo.srcObject = remoteStream;
    });

    currentCall = call;
    joinPopup.classList.add("hidden");
    showVideoInterface();
  });
});

// Get user media stream
function getLocalStream() {
  return navigator.mediaDevices.getUserMedia({ video: true, audio: true });
}

// Setup local video
function setupLocalStream(stream) {
  localStream = stream;
  localVideo.srcObject = stream;
}

// Show video UI
function showVideoInterface() {
  videoInterface.classList.remove("hidden");
}

// Toggle Video
toggleVideoBtn.addEventListener("click", () => {
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    toggleVideoBtn.textContent = videoTrack.enabled ? "📹" : "📷";
  }
});

// Toggle Audio
toggleAudioBtn.addEventListener("click", () => {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    toggleAudioBtn.textContent = audioTrack.enabled ? "🎤" : "🔇";
  }
});

// End Call
endCallBtn.addEventListener("click", () => {
  if (currentCall) {
    currentCall.close();
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  location.reload(); // reload to reset app
});
