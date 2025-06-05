const rolePopup = document.getElementById("rolePopup");
const createPopup = document.getElementById("createPopup");
const joinPopup = document.getElementById("joinPopup");
const waitingPopup = document.getElementById("waitingPopup");

const myIdInput = document.getElementById("myId");
const connectInput = document.getElementById("connectTo");
const copyBtn = document.getElementById("copyBtn");
const startBtn = document.getElementById("startBtn");
const connectBtn = document.getElementById("connectBtn");

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let peer;
let localStream;
let call;

const generateId = () => 'user-' + Math.random().toString(36).substring(2, 8);

function chooseRole(role) {
  rolePopup.style.display = "none";
  if (role === 'create') {
    const id = generateId();
    myIdInput.value = id;
    createPopup.style.display = "flex";
  } else {
    joinPopup.style.display = "flex";
  }
}

copyBtn.onclick = () => {
  navigator.clipboard.writeText(myIdInput.value);
  alert("Copied ID!");
};

startBtn.onclick = async () => {
  createPopup.style.display = "none";
  waitingPopup.style.display = "flex";

  peer = new Peer(myIdInput.value);

  peer.on("open", id => console.log("Peer opened:", id));

  peer.on("call", async incomingCall => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    call = incomingCall;
    call.answer(localStream);

    call.on("stream", remoteStream => {
      remoteVideo.srcObject = remoteStream;
      waitingPopup.style.display = "none";
    });
  });

  peer.on('error', err => {
    alert("Error: " + err);
    console.error(err);
    waitingPopup.style.display = "none";
    rolePopup.style.display = "flex";
  });
};

connectBtn.onclick = async () => {
  const target = connectInput.value.trim();
  if (!target) return alert("Enter a valid ID to connect.");

  joinPopup.style.display = "none";
  waitingPopup.style.display = "flex";

  peer = new Peer();

  peer.on("open", async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    call = peer.call(target, localStream);

    call.on("stream", remoteStream => {
      remoteVideo.srcObject = remoteStream;
      waitingPopup.style.display = "none";
    });

    call.on("close", () => {
      alert("Call ended.");
      window.location.reload();
    });

    call.on("error", err => {
      alert("Call error: " + err);
      console.error(err);
      window.location.reload();
    });
  });

  peer.on('error', err => {
    alert("Peer error: " + err);
    console.error(err);
    waitingPopup.style.display = "none";
    rolePopup.style.display = "flex";
  });
};
