// DOM elements
const rolePopup = document.getElementById("rolePopup");
const createPopup = document.getElementById("createPopup");
const joinPopup = document.getElementById("joinPopup");
const videoContainer = document.querySelector(".video-container");

const myIdInput = document.getElementById("myId");
const connectInput = document.getElementById("connectTo");
const copyBtn = document.getElementById("copyBtn");
const startBtn = document.getElementById("startBtn");
const connectBtn = document.getElementById("connectBtn");

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let peer;
let localStream;
let currentCall;

// Generate random ID
function generateId() {
  return 'user-' + Math.random().toString(36).substring(2, 8);
}

// Show Create or Join popup
function chooseRole(role) {
  rolePopup.style.display = "none";
  if (role === "create") {
    myIdInput.value = generateId();
    createPopup.style.display = "flex";
  } else {
    joinPopup.style.display = "flex";
  }
}

// Copy Call ID
copyBtn.onclick = () => {
  navigator.clipboard.writeText(myIdInput.value)
    .then(() => alert("Copied Call ID!"))
    .catch(() => alert("Copy failed!"));
};

// Start call as creator
startBtn.onclick = async () => {
  createPopup.style.display = "none";
  videoContainer.style.display = "flex";

  peer = new Peer(myIdInput.value);

  peer.on("open", async (id) => {
    console.log("My peer ID:", id);
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peer.on("call", (call) => {
      currentCall = call;
      call.answer(localStream);
      call.on("stream", (remoteStream) => {
        remoteVideo.srcObject = remoteStream;
      });
    });
  });

  peer.on("error", (err) => {
    alert("Peer error: " + err);
    console.error(err);
    window.location.reload();
  });
};

// Join call as joiner
connectBtn.onclick = async () => {
  const targetId = connectInput.value.trim();
  if (!targetId) return alert("Please enter a Call ID.");

  joinPopup.style.display = "none";
  videoContainer.style.display = "flex";

  peer = new Peer();

  peer.on("open", async (id) => {
    console.log("My peer ID:", id);
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    currentCall = peer.call(targetId, localStream);
    currentCall.on("stream", (remoteStream) => {
      remoteVideo.srcObject = remoteStream;
    });

    currentCall.on("close", () => {
      alert("Call ended.");
      window.location.reload();
    });

    currentCall.on("error", (err) => {
      alert("Call error: " + err);
      console.error(err);
      window.location.reload();
    });
  });

  peer.on("error", (err) => {
    alert("Peer error: " + err);
    console.error(err);
    window.location.reload();
  });
};
