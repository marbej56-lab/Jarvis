/* =====================================================
   J.A.R.V.I.S. VOICE AI CORE - LIVELY ORGANIC CLOUD
===================================================== */

const canvas = document.getElementById("sphere");
const ctx = canvas.getContext("2d");

let width;
let height;
let centerX;
let centerY;

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    width = rect.width;
    height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    centerX = width / 2;
    centerY = height / 2;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* =====================================================
   AUDIO ANALYZER FOR SPEECH/TALKING REACTIVITY
===================================================== */

let audioCtx = null;
let analyser = null;
let audioSource = null;
let audioData = new Uint8Array(0);
let currentVolume = 0;

async function setupAudioAnalyzer(stream) {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        
        audioCtx = new AudioContextClass();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        audioSource = audioCtx.createMediaStreamSource(stream);
        audioSource.connect(analyser);
        audioData = new Uint8Array(analyser.frequencyBinCount);
    } catch (e) {
        console.log("Audio analyzer setup omitted:", e);
    }
}

function updateVolume() {
    if (!analyser) return;
    analyser.getByteFrequencyData(audioData);
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
        sum += audioData[i];
    }
    const average = sum / audioData.length;
    currentVolume += (average - currentVolume) * 0.2;
}

/* =====================================================
   PARTICLE CLOUD SETUP (ASYMMETRICAL & LIVELY)
===================================================== */

const PARTICLE_COUNT = 1400;
const particles = [];

function createParticles() {
    particles.length = 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        
        const asymmetry = 0.8 + Math.sin(theta * 3) * 0.25 + Math.cos(phi * 2) * 0.15;
        const r = (0.5 + Math.pow(Math.random(), 0.5) * 0.5) * asymmetry;

        particles.push({
            bx: r * Math.sin(phi) * Math.cos(theta),
            by: r * Math.cos(phi) * 1.15,
            bz: r * Math.sin(phi) * Math.sin(theta),
            
            speed: 0.2 + Math.random() * 0.8,
            seed: Math.random() * 100,
            orbitRadius: 0.05 + Math.random() * 0.1,
            pulsePhase: Math.random() * Math.PI * 2
        });
    }
}

createParticles();

let currentScale = 1;
let targetScale = 1;
let rotationY = 0;
let rotationX = 0;
let currentMode = "PASSIVE";

/* =====================================================
   RENDER LOOP
===================================================== */

function drawSphere() {
    ctx.clearRect(0, 0, width, height);

    updateVolume();

    currentScale += (targetScale - currentScale) * 0.05;

    let rotationSpeed = 0.001;
    if (currentMode === "LISTENING") rotationSpeed = 0.003;
    if (currentMode === "THINKING") rotationSpeed = 0.008;
    if (currentMode === "SPEAKING") rotationSpeed = 0.004;

    rotationY += rotationSpeed;
    rotationX += rotationSpeed * 0.35;

    const baseRadius = Math.min(width, height) * 0.32;
    const time = Date.now() * 0.0015;

    const voiceFactor = (currentVolume / 255) * 2.2;

    const projected = [];

    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const noiseX = Math.sin(time * p.speed + p.seed) * p.orbitRadius;
        const noiseY = Math.cos(time * p.speed * 0.8 + p.seed) * p.orbitRadius;
        const noiseZ = Math.sin(time * p.speed * 1.2 + p.seed) * p.orbitRadius;

        let displacement = 1;
        
        if (currentMode === "LISTENING") {
            displacement += voiceFactor * 0.8 + Math.sin(time * 3 + p.pulsePhase) * 0.1;
        } else if (currentMode === "THINKING") {
            displacement += Math.sin(time * 8 + p.seed) * 0.25;
        } else if (currentMode === "SPEAKING") {
            displacement += Math.sin(time * 5 + p.by * 4) * 0.2 + (Math.random() * 0.05);
        } else {
            displacement += Math.sin(time * 1.5 + p.pulsePhase) * 0.06;
        }

        let x = (p.bx + noiseX) * displacement;
        let y = (p.by + noiseY) * displacement;
        let z = (p.bz + noiseZ) * displacement;

        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);
        let rx = x * cosY - z * sinY;
        let rz = x * sinY + z * cosY;
        x = rx;
        z = rz;

        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);
        let ry = y * cosX - z * sinX;
        let rz2 = y * sinX + z * cosX;
        y = ry;
        z = rz2;

        const radius = baseRadius * currentScale;
        const perspective = 1 / (1.5 - z * 0.4);

        const screenX = centerX + x * radius * perspective;
        const screenY = centerY + y * radius * perspective;

        const depth = (z + 1) / 2;
        const size = 0.5 + depth * 1.8 + (currentMode === "SPEAKING" ? 0.4 : 0);

        let opacity = 0.1 + depth * 0.7;
        if (currentMode === "PASSIVE") opacity *= 0.45;

        projected.push({
            x: screenX,
            y: screenY,
            z,
            size,
            opacity
        });
    }

    projected.sort((a, b) => a.z - b.z);

    for (const p of projected) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

        if (currentMode === "PASSIVE") {
            ctx.fillStyle = `rgba(0, 110, 190, ${p.opacity})`;
        } else if (currentMode === "THINKING") {
            ctx.fillStyle = `rgba(0, 230, 255, ${p.opacity})`;
        } else if (currentMode === "SPEAKING") {
            ctx.fillStyle = `rgba(100, 220, 255, ${p.opacity})`;
        } else {
            ctx.fillStyle = `rgba(0, 185, 255, ${p.opacity})`;
        }

        ctx.fill();

        if (p.z > 0.4 && currentMode !== "PASSIVE") {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 190, 255, ${p.opacity * 0.12})`;
            ctx.fill();
        }
    }

    requestAnimationFrame(drawSphere);
}

drawSphere();

/* =====================================================
   UI CONTROLS & MODES
===================================================== */

const modeText = document.getElementById("modeText");
const transcript = document.getElementById("transcript");
const activity = document.getElementById("activity");

const modes = {
    passive: document.getElementById("passiveMode"),
    listening: document.getElementById("listeningMode"),
    thinking: document.getElementById("thinkingMode"),
    speaking: document.getElementById("speakingMode")
};

function setMode(mode) {
    currentMode = mode.toUpperCase();

    if (modeText) modeText.textContent = currentMode;

    Object.values(modes).forEach(element => {
        if (element) element.classList.remove("active");
    });

    const selected = modes[mode.toLowerCase()];
    if (selected) selected.classList.add("active");

    switch (currentMode) {
        case "PASSIVE":
            targetScale = 0.95;
            break;
        case "LISTENING":
            targetScale = 0.85;
            break;
        case "THINKING":
            targetScale = 1.05;
            break;
        case "SPEAKING":
            targetScale = 1.15;
            break;
    }
}

/* =====================================================
   PERSISTENT MEMORY & GROQ STORAGE
===================================================== */

const MEMORY_KEY = "jarvis_memory_v1";
const GROQ_KEY_STORAGE = "jarvis_groq_key";

let jarvisMemory = JSON.parse(localStorage.getItem(MEMORY_KEY)) || {
    userProfile: {},
    chatHistory: [],
    savedFacts: []
};

function saveMemory() {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(jarvisMemory));
}

function saveGroqKey() {
    const input = document.getElementById("groqKeyInput");
    if (input && input.value.trim()) {
        localStorage.setItem(GROQ_KEY_STORAGE, input.value.trim());
        document.getElementById("apiModal").style.display = "none";
        addActivity("Groq API key saved");
    }
}

function checkGroqKey() {
    const key = localStorage.getItem(GROQ_KEY_STORAGE);
    if (!key) {
        document.getElementById("apiModal").style.display = "flex";
        return null;
    }
    return key;
}

/* =====================================================
   ACTIVITY LOG
===================================================== */

function addActivity(message) {
    if (!activity) return;

    const line = document.createElement("div");
    line.className = "activity-line";

    const dot = document.createElement("span");
    dot.className = "activity-dot";

    const text = document.createElement("span");
    text.textContent = message;

    line.appendChild(dot);
    line.appendChild(text);

    activity.prepend(line);

    while (activity.children.length > 8) {
        activity.removeChild(activity.lastChild);
    }
}

/* =====================================================
   VOICE SYSTEM & SPEECH RECOGNITION (FAST IPAD FIX)
===================================================== */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let microphoneStarted = false;
let activeSession = false;
let aiBusy = false;
let inactivityTimer = null;
let speechSilenceTimer = null;
const INACTIVITY_TIME = 45 * 1000;

function getTimeContext() {
    const now = new Date();
    return {
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        day: now.toLocaleDateString(undefined, { weekday: "long" }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
}

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = function () {
        microphoneStarted = true;
        addActivity("Microphone online");

        if (!activeSession) {
            setMode("PASSIVE");
            transcript.textContent = 'Say "Jarvis" to activate';
        }
    };

    recognition.onresult = function (event) {
        let finalText = "";
        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const text = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalText += text;
            } else {
                interimText += text;
            }
        }

        const spoken = (finalText || interimText).toLowerCase().trim();

        if (!activeSession) {
            if (spoken.includes("jarvis")) {
                activateJarvis(spoken);
            }
            return;
        }

        const currentSpeech = (finalText || interimText).trim();

        if (currentSpeech) {
            transcript.textContent = currentSpeech;
            resetInactivityTimer();

            // Clear previous timer on every new word spoken
            clearTimeout(speechSilenceTimer);

            // Automatically send prompt after 1.2s of silence (Fixes iPad Safari lag)
            if (!aiBusy && currentSpeech.length > 2) {
                speechSilenceTimer = setTimeout(() => {
                    if (!aiBusy && activeSession) {
                        const cleanPrompt = currentSpeech.replace(/\bjarvis\b/gi, "").trim();
                        if (cleanPrompt.length > 1) {
                            try { recognition.stop(); } catch(e){}
                            handleUserSpeech(cleanPrompt);
                        }
                    }
                }, 1200);
            }
        }
    };

    recognition.onend = function () {
        if (!microphoneStarted) return;
        setTimeout(() => {
            if (!aiBusy) {
                try { recognition.start(); } catch (error) {}
            }
        }, 300);
    };

    recognition.onerror = function (event) {
        console.log("Speech recognition error:", event.error);
    };
}

async function startMicrophone() {
    if (!recognition) {
        transcript.textContent = "Speech recognition is not supported";
        addActivity("Speech recognition unavailable");
        return;
    }

    try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setupAudioAnalyzer(stream);
        }

        microphoneStarted = true;
        try {
            recognition.start();
        } catch (error) {
            console.log(error);
        }
    } catch (error) {
        console.log("Microphone permission:", error);
        transcript.textContent = "Allow microphone access in Safari";
        addActivity("Microphone permission required");
    }
}

function activateJarvis(spokenText) {
    activeSession = true;
    resetInactivityTimer();
    setMode("LISTENING");
    addActivity("Wake word detected");
    addActivity("Voice interface activated");
    transcript.textContent = "I'm listening";

    const command = spokenText.replace(/\bjarvis\b/gi, "").trim();
    if (command.length > 2) {
        handleUserSpeech(command);
    }
}

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(goToStandby, INACTIVITY_TIME);
}

function goToStandby() {
    activeSession = false;
    aiBusy = false;
    setMode("PASSIVE");
    transcript.textContent = 'Say "Jarvis" to activate';
    addActivity("Returning to standby");
}

function handleUserSpeech(text) {
    if (!activeSession || aiBusy) return;

    setMode("THINKING");
    transcript.textContent = text;
    resetInactivityTimer();
    addActivity("Voice input received");

    sendToAI(text);
}

/* =====================================================
   SEND TO GROQ API (LLAMA 3.3 70B)
===================================================== */

async function sendToAI(text) {
    const apiKey = checkGroqKey();
    if (!apiKey) {
        aiBusy = false;
        setMode("PASSIVE");
        transcript.textContent = "Groq API key required";
        return;
    }

    aiBusy = true;
    setMode("THINKING");
    addActivity("Connecting to Groq LPU...");

    const time = getTimeContext();

    const systemPrompt = `You are J.A.R.V.I.S., an advanced AI assistant.
Current Date: ${time.date} (${time.day})
Current Time: ${time.time}

Stored Memories: ${JSON.stringify(jarvisMemory.userProfile)}
Known Facts: ${jarvisMemory.savedFacts.join("; ")}

Instructions:
- Keep answers concise, direct, and natural for voice output.
- Remember details shared by the user.
- Maintain a helpful, slightly witty persona.`;

    const messages = [
        { role: "system", content: systemPrompt }
    ];

    jarvisMemory.chatHistory.slice(-10).forEach(msg => {
        messages.push({ role: msg.role, content: msg.text });
    });

    messages.push({ role: "user", content: text });

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: messages,
                temperature: 0.6,
                max_tokens: 300
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || "Groq API Request failed");
        }

        const data = await response.json();
        const aiText = data.choices[0].message.content;

        jarvisMemory.chatHistory.push({ role: "user", text: text });
        jarvisMemory.chatHistory.push({ role: "assistant", text: aiText });
        
        if (jarvisMemory.chatHistory.length > 20) {
            jarvisMemory.chatHistory = jarvisMemory.chatHistory.slice(-20);
        }
        
        saveMemory();
        addActivity("Llama 3.3 70B response received");
        respond(aiText);

    } catch (error) {
        console.error("Groq Error:", error);
        aiBusy = false;
        setMode("LISTENING");
        transcript.textContent = "Error connecting to Groq Core.";
        addActivity("API Error: " + error.message);
        resetInactivityTimer();
    }
}

function respond(text) {
    aiBusy = false;
    setMode("SPEAKING");
    transcript.textContent = text;
    addActivity("Response generated");
    resetInactivityTimer();
    speak(text);
}

function speak(text) {
    if (!window.speechSynthesis) {
        setMode("LISTENING");
        return;
    }

    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.rate = 1;
    speech.pitch = 0.85;
    speech.volume = 1;

    speech.onstart = function () {
        setMode("SPEAKING");
    };

    speech.onend = function () {
        if (!activeSession) return;
        setMode("LISTENING");
        transcript.textContent = "I'm listening";
        addActivity("Listening for next command");
        resetInactivityTimer();
    };

    window.speechSynthesis.speak(speech);
}

/* =====================================================
   INITIALIZATION
===================================================== */

setMode("PASSIVE");
transcript.textContent = 'Tap once, allow microphone, then say "Jarvis"';
addActivity("J.A.R.V.I.S. initialized");
addActivity("Particle cloud online");
addActivity("Groq core ready");

document.addEventListener("click", function startOnce() {
    startMicrophone();
    checkGroqKey();
    document.removeEventListener("click", startOnce);
}, { once: true });
