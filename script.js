const welcome = document.getElementById("welcome");
const rolePopup = document.getElementById("rolePopup");
const createPopup = document.getElementById("createPopup");
const joinPopup = document.getElementById("joinPopup");
const videoInterface = document.getElementById("videoInterface");

const myIdInput = document.getElementById("myId");
const connectToInput = document.getElementById("connectTo");
const joinLink = document.getElementById("joinLink");

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const toggleVideoBtn = document.getElementById("toggleVideoBtn");
const toggleAudioBtn = document.getElementById("toggleAudioBtn");
const endCallBtn = document.getElementById("endCallBtn");

const callTimer = document.getElementById("callTimer");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const sendMsgBtn = document.getElementById("sendMsgBtn");

let localStream, currentCall, currentConn, timerInterval;
let peer = new Peer({ host: 'peerjs-server.herokuapp.com', secure: true, port: 443 });

document.getElementById("startCallingBtn").onclick = () => {
  welcome.classList.add("hidden");
  rolePopup.classList.remove("hidden");
};

function chooseRole(role) {
  rolePopup.classList.add("hidden");
  if (role === "create") {
    createPopup.classList.remove("hidden");
    peer.on("open", id => {
      myIdInput.value = id;
      joinLink.innerText = `${window.location.origin}${window.location.pathname}?join=${id}`;
    });
    peer.on("error", err => {
      console.error("PeerJS Error:", err);
      alert("Failed to generate Call ID. Please try again.");
      joinLink.innerText = "Failed to generate link.";
    });
  } else {
    joinPopup.classList.remove("hidden");
  }
}

function copyId() {
  if (myIdInput.value) {
    navigator.clipboard.writeText(myIdInput.value);
    alert("Call ID copied!");
  } else {
    alert("No Call ID available to copy.");
  }
}

document.getElementById("startBtn").onclick = async () => {
  try {
    createPopup.classList.add("hidden");
    videoInterface.classList.remove("hidden");
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    startVisualizer(localStream);

    peer.on("call", call => {
      currentCall = call;
      call.answer(localStream);
      call.on("stream", stream => {
        remoteVideo.srcObject = stream;
      });
      call.on("error", err => console.error("Call Error:", err));
      startCallTimer();
    });

    peer.on("connection", conn => {
      currentConn = conn;
      conn.on("data", addChatMessage);
      conn.on("error", err => console.error("Connection Error:", err));
    });
  } catch (err) {
    console.error("Media Error:", err);
    alert("Failed to access camera/microphone. Please check permissions.");
  }
};

document.getElementById("connectBtn").onclick = async () => {
  if (!connectToInput.value.trim()) {
    alert("Please enter a valid Call ID.");
    return;
  }
  try {
    joinPopup.classList.add("hidden");
    videoInterface.classList.remove("hidden");

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    startVisualizer(localStream);

    const call = peer.call(connectToInput.value, localStream);
    currentCall = call;
    call.on("stream", stream => {
      remoteVideo.srcObject = stream;
    });
    call.on("error", err => console.error("Call Error:", err));

    const conn = peer.connect(connectToInput.value);
    currentConn = conn;
    conn.on("data", addChatMessage);
    conn.on("error", err => console.error("Connection Error:", err));

    startCallTimer();
  } catch (err) {
    console.error("Media Error:", err);
    alert("Failed to access camera/microphone or connect to peer. Please check permissions and Call ID.");
  }
};

// Controls
toggleVideoBtn.onclick = () => {
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    toggleVideoBtn.textContent = videoTrack.enabled ? "📹" : "🚫📹";
  }
};

toggleAudioBtn.onclick = () => {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    toggleAudioBtn.textContent = audioTrack.enabled ? "🎤" : "🔇";
  }
};

endCallBtn.onclick = () => {
  if (currentCall) currentCall.close();
  if (currentConn) currentConn.close();
  if (localStream) localStream.getTracks().forEach(track => track.stop());
  clearInterval(timerInterval);
  location.reload();
};

// Chat
sendMsgBtn.onclick = () => {
  const msg = chatInput.value.trim();
  if (msg && currentConn) {
    currentConn.send(msg);
    addChatMessage(`You: ${msg}`);
    chatInput.value = "";
  }
};

function addChatMessage(msg) {
  const msgElem = document.createElement("div");
  msgElem.textContent = msg;
  chatMessages.appendChild(msgElem);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Timer
function startCallTimer() {
  let seconds = 0;
  timerInterval = setInterval(() => {
    seconds++;
    let mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    let secs = String(seconds % 60).padStart(2, '0');
    callTimer.textContent = `${mins}:${secs}`;
  }, 1000);
}

// Visualizer
function startVisualizer(stream) {
  const canvas = document.getElementById("visualizer");
  const ctx = canvas.getContext("2d");
  canvas.width = 200;
  canvas.height = 50;

  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  source.connect(analyser);
  analyser.fftSize = 64;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength);
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      let barHeight = dataArray[i];
      ctx.fillStyle = "lime";
      ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
      x += barWidth + 1;
    }
  }
  draw();
}

// Join via link
window.onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("join")) {
    const id = urlParams.get("join");
    welcome.classList.add("hidden");
    joinPopup.classList.remove("hidden");
    connectToInput.value = id;
  }
};