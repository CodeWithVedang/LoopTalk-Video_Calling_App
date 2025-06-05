// Skeleton loader → Welcome screen
window.onload = function () {
  setTimeout(() => {
    document.getElementById("skeletonLoader").style.display = "none";
    document.getElementById("welcomePage").style.display = "flex";
  }, 1000);
};

document.getElementById("welcomeStartBtn").onclick = () => {
  document.getElementById("welcomePage").style.display = "none";
  document.getElementById("rolePopup").style.display = "flex";
};

let peer;
let localStream;
let currentCall;

// Select Role
function chooseRole(role) {
  document.getElementById("rolePopup").style.display = "none";
  if (role === "create") {
    const id = Math.random().toString(36).substr(2, 9);
    document.getElementById("myId").value = id;
    document.getElementById("createPopup").style.display = "flex";
    peer = new Peer(id);
    peer.on("call", answerCall);
  } else {
    document.getElementById("joinPopup").style.display = "flex";
    peer = new Peer();
    peer.on("open", () => {});
  }
}

// Copy Call ID
document.getElementById("copyBtn").onclick = () => {
  const id = document.getElementById("myId").value;
  navigator.clipboard.writeText(id);
  alert("Call ID copied!");
};

// Start Call
document.getElementById("startBtn").onclick = async () => {
  await startMedia();
  document.getElementById("createPopup").style.display = "none";
};

// Join Call
document.getElementById("connectBtn").onclick = async () => {
  const id = document.getElementById("connectTo").value.trim();
  if (!id) return alert("Enter a valid Call ID");
  await startMedia();
  const call = peer.call(id, localStream);
  setupCall(call);
  document.getElementById("joinPopup").style.display = "none";
};

// Handle Incoming Call
function answerCall(call) {
  call.answer(localStream);
  setupCall(call);
}

// Setup Media
async function startMedia() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById("localVideo").srcObject = localStream;
  document.querySelector(".video-container").style.display = "flex";
  document.querySelector(".controls").style.display = "flex";
}

// Setup Call
function setupCall(call) {
  currentCall = call;
  call.on("stream", (remoteStream) => {
    document.getElementById("remoteVideo").srcObject = remoteStream;
  });
  call.on("close", endCall);
}

// Toggle Video
document.getElementById("toggleVideoBtn").onclick = () => {
  localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
};

// Toggle Audio
document.getElementById("toggleAudioBtn").onclick = () => {
  localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
};

// End Call
document.getElementById("endCallBtn").onclick = () => {
  if (currentCall) currentCall.close();
  endCall();
};

function endCall() {
  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
  }
  location.reload();
}
