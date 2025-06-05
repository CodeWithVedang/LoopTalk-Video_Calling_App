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
let peer;

// Initialize PeerJS with STUN/TURN servers for WebRTC
function initializePeer(attempt = 1, maxAttempts = 3) {
  console.log(`Attempting to connect to PeerJS server (Attempt ${attempt}/${maxAttempts})`);
  peer = new Peer({
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }, // Free STUN server
        // Add TURN server credentials if available (e.g., from Twilio or Xirsys)
        // { urls: "turn:your.turn.server", username: "username", credential: "password" }
      ]
    },
    debug: 3 // Enable detailed logging
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (joinLink.innerText === "Generating link...") {
        if (attempt < maxAttempts) {
          console.warn(`PeerJS connection timed out. Retrying (${attempt + 1}/${maxAttempts})...`);
          peer.destroy();
          resolve(initializePeer(attempt + 1, maxAttempts));
        } else {
          reject(new Error("Failed to connect to PeerJS server after multiple attempts."));
        }
      }
    }, 10000);

    peer.on("open", id => {
      clearTimeout(timeout);
      console.log("PeerJS ID generated:", id);
      resolve(id);
    });

    peer.on("error", err => {
      clearTimeout(timeout);
      console.error("PeerJS Error:", err.type, err.message);
      if (attempt < maxAttempts) {
        console.warn(`PeerJS error on attempt ${attempt}. Retrying...`);
        peer.destroy();
        resolve(initializePeer(attempt + 1, maxAttempts));
      } else {
        reject(err);
      }
    });
  });
}

document.getElementById("startCallingBtn").onclick = () => {
  welcome.classList.add("hidden");
  rolePopup.classList.remove("hidden");
};

function chooseRole(role) {
  rolePopup.classList.add("hidden");
  if (role === "create") {
    createPopup.classList.remove("hidden");
    joinLink.innerText = "Generating link...";
    
    initializePeer().then(id => {
      myIdInput.value = id;
      joinLink.innerText = `${window.location.origin}${window.location.pathname}?join=${id}`;
    }).catch(err => {
      console.error("PeerJS Initialization Failed:", err);
      joinLink.innerText = "Failed to generate link. Please refresh and try again.";
      alert(`Failed to connect to PeerJS server: ${err.message}. Please check your network or try again later.`);
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
    alert("No Call ID available to copy. Please wait for the ID to generate.");
  }
}

document.getElementById("startBtn").onclick = async () => {
  if (!myIdInput.value) {
    alert("Call ID not generated yet. Please wait or refresh.");
    return;
  }
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
        console.log("Received remote stream");
        remoteVideo.srcObject = stream;
      });
      call.on("error", err => {
        console.error("Call Error:", err);
        alert(`Call error: ${err.message}. Please try again.`);
      });
      call.on("close", () => {
        console.log("Call closed");
        alert("Call disconnected. Returning to main screen.");
        endCallBtn.onclick();
      });
      startCallTimer();
    });

    peer.on("connection", conn => {
      currentConn = conn;
      conn.on("data", addChatMessage);
      conn.on("error", err => console.error("Connection Error:", err));
      conn.on("close", () => console.log("Chat connection closed"));
    });
  } catch (err) {
    console.error("Media Error:", err);
    alert("Failed to access camera/microphone. Please check permissions and ensure devices are available.");
    videoInterface.classList.add("hidden");
    createPopup.classList.remove("hidden");
  }
};

document.getElementById("connectBtn").onclick = async () => {
  const peerId = connectToInput.value.trim();
  if (!peerId) {
    alert("Please enter a valid Call ID.");
    return;
  }
  try {
    joinPopup.classList.add("hidden");
    videoInterface.classList.remove("hidden");

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    startVisualizer(localStream);

    const call = peer.call(peerId, localStream);
    if (!call) {
      throw new Error("Failed to initiate call. Peer may not be available.");
    }
    currentCall = call;
    call.on("stream", stream => {
      console.log("Received remote stream");
      remoteVideo.srcObject = stream;
    });
    call.on("error", err => {
      console.error("Call Error:", err);
      alert(`Failed to connect to peer: ${err.message}. Please check the Call ID and try again.`);
      videoInterface.classList.add("hidden");
      joinPopup.classList.remove("hidden");
    });
    call.on("close", () => {
      console.log("Call closed");
      alert("Call disconnected. Returning to main screen.");
      endCallBtn.onclick();
    });

    const conn = peer.connect(peerId);
    if (!conn) {
      throw new Error("Failed to initiate chat connection.");
    }
    currentConn = conn;
    conn.on("data", addChatMessage);
    conn.on("error", err => console.error("Connection Error:", err));
    conn.on("close", () => console.log("Chat connection closed"));

    startCallTimer();
  } catch (err) {
    console.error("Error in join call:", err);
    alert(`Failed to start call: ${err.message}. Please check permissions, Call ID, and network.`);
    videoInterface.classList.add("hidden");
    joinPopup.classList.remove("hidden");
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
  if (peer) peer.destroy();
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
  } else if (!currentConn) {
    alert("No active chat connection. Please ensure the call is connected.");
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