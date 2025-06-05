const welcome = document.getElementById("welcome");
const rolePopup = document.getElementById("rolePopup");
const createPopup = document.getElementById("createPopup");
const joinPopup = document.getElementById("joinPopup");
const videoInterface = document.getElementById("videoInterface");

let peer;
let localStream;
let currentCall;

document.getElementById("startCallingBtn").onclick = () => {
  welcome.style.display = "none";
  rolePopup.classList.remove("hidden");
};

function chooseRole(role) {
  rolePopup.classList.add("hidden");

  if (role === "create") {
    const id = Math.random().toString(36).substring(2, 10);
    document.getElementById("myId").value = id;
    peer = new Peer(id);
    peer.on("call", (call) => {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        localStream = stream;
        document.getElementById("localVideo").srcObject = stream;
        call.answer(stream);
        call.on("stream", (remoteStream) => {
          document.getElementById("remoteVideo").srcObject = remoteStream;
        });
        currentCall = call;
        showInterface();
      });
    });
    createPopup.classList.remove("hidden");
  } else {
    peer = new Peer();
    joinPopup.classList.remove("hidden");
  }
}

document.getElementById("startBtn").onclick = async () => {
  createPopup.classList.add("hidden");
  showInterface();
};

document.getElementById("connectBtn").onclick = () => {
  const connectToId = document.getElementById("connectTo").value.trim();
  if (!connectToId) return alert("Enter a valid ID");
  navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
    localStream = stream;
    document.getElementById("localVideo").srcObject = stream;
    const call = peer.call(connectToId, stream);
    call.on("stream", (remoteStream) => {
      document.getElementById("remoteVideo").srcObject = remoteStream;
    });
    currentCall = call;
    joinPopup.classList.add("hidden");
    showInterface();
  });
};

function showInterface() {
  videoInterface.classList.remove("hidden");
}

function copyId() {
  const id = document.getElementById("myId").value;
  navigator.clipboard.writeText(id);
  alert("Copied: " + id);
}

// Controls
document.getElementById("toggleVideoBtn").onclick = () => {
  localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
};

document.getElementById("toggleAudioBtn").onclick = () => {
  localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
};

document.getElementById("endCallBtn").onclick = () => {
  if (currentCall) currentCall.close();
  if (localStream) localStream.getTracks().forEach(t => t.stop());
  location.reload();
};
