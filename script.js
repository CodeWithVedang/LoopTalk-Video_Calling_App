const rolePopup = document.getElementById("rolePopup");
const createPopup = document.getElementById("createPopup");
const joinPopup = document.getElementById("joinPopup");
const videoContainer = document.querySelector(".video-container");
const controls = document.querySelector(".controls");

const myIdInput = document.getElementById("myId");
const connectInput = document.getElementById("connectTo");
const copyBtn = document.getElementById("copyBtn");
const startBtn = document.getElementById("startBtn");
const connectBtn = document.getElementById("connectBtn");

const toggleVideoBtn = document.getElementById("toggleVideoBtn");
const toggleAudioBtn = document.getElementById("toggleAudioBtn");
const endCallBtn = document.getElementById("endCallBtn");

const videoIcon = document.getElementById("videoIcon");
const audioIcon = document.getElementById("audioIcon");

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let peer;
let localStream;
let currentCall;

function generateId() {
  return 'user-' + Math.random().toString(36).substring(2, 8);
}

function chooseRole(role) {
  rolePopup.style.display = "none";
  if (role === "create") {
    myIdInput.value = generateId();
    createPopup.style.display = "flex";
  } else {
    joinPopup.style.display = "flex";
  }
}

copyBtn.onclick = () => {
  navigator.clipboard.writeText(myIdInput.value)
    .then(() => alert("Copied Call ID!"))
    .catch(() => alert("Copy failed!"));
};

startBtn.onclick = async () => {
  createPopup.style.display = "none";
  videoContainer.style.display = "flex";
  controls.style.display = "flex";

  peer = new Peer(myIdInput.value);

  peer.on("open", async (id) => {
    console.log("My peer ID:", id);
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.srcObject = localStream;
    } catch (e) {
      alert("Error accessing camera/mic: " + e.message);
      window.location.reload();
      return;
    }

    peer.on("call", (call) => {
      currentCall = call;
      call.answer(localStream);
      call.on("stream", (remoteStream) => {
        remoteVideo.srcObject = remoteStream;
      });
      call.on("close", () => endCall());
      call.on("error", (err) => {
        alert("Call error: " + err);
        endCall();
      });
    });
  });

  peer.on("error", (err) => {
    alert("Peer error: " + err);
    console.error(err);
    window.location.reload();
  });
};

connectBtn.onclick = async () => {
  const targetId = connectInput.value.trim();
  if (!targetId) return alert("Please enter a Call ID.");

  joinPopup.style.display = "none";
  videoContainer.style.display = "flex";
  controls.style.display = "flex";

  peer = new Peer();

  peer.on("open", async (id) => {
    console.log("My peer ID:", id);
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.srcObject = localStream;
    } catch (e) {
      alert("Error accessing camera/mic: " + e.message);
      window.location.reload();
      return;
    }

    currentCall = peer.call(targetId, localStream);

    currentCall.on("stream", (remoteStream) => {
      remoteVideo.srcObject = remoteStream;
    });

    currentCall.on("close", () => endCall());
    currentCall.on("error", (err) => {
      alert("Call error: " + err);
      endCall();
    });
  });

  peer.on("error", (err) => {
    alert("Peer error: " + err);
    console.error(err);
    window.location.reload();
  });
};

// Controls buttons:

toggleVideoBtn.onclick = () => {
  if (!localStream) return;
  const videoTrack = localStream.getVideoTracks()[0];
  if (!videoTrack) return;

  videoTrack.enabled = !videoTrack.enabled;
  videoIcon.textContent = videoTrack.enabled ? "📹" : "🚫";
  toggleVideoBtn.title = videoTrack.enabled ? "Turn Off Video" : "Turn On Video";
};

toggleAudioBtn.onclick = () => {
  if (!localStream) return;
  const audioTrack = localStream.getAudioTracks()[0];
  if (!audioTrack) return;

  audioTrack.enabled = !audioTrack.enabled;
  audioIcon.textContent = audioTrack.enabled ? "🎤" : "🔇";
  toggleAudioBtn.title = audioTrack.enabled ? "Mute Microphone" : "Unmute Microphone";
};

endCallBtn.onclick = () => {
  if (currentCall) {
    currentCall.close();
  }
  endCall();
};

function endCall() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
  videoContainer.style.display = "none";
  controls.style.display = "none";
  currentCall = null;
  if (peer) peer.destroy();
  peer = null;

  rolePopup.style.display = "flex";
  createPopup.style.display = "none";
  joinPopup.style.display = "none";

  // Reset inputs
  connectInput.value = "";
  myIdInput.value = "";
}
