/* =====================================================
   J.A.R.V.I.S.
   3D PARTICLE SPHERE
===================================================== */


/* =====================================================
   CANVAS
===================================================== */

const canvas = document.getElementById("sphere");
const ctx = canvas.getContext("2d");

let width;
let height;
let centerX;
let centerY;


/* =====================================================
   CANVAS RESOLUTION
===================================================== */

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
   PARTICLE SETTINGS
===================================================== */

const PARTICLE_COUNT = 1800;
const particles = [];


/* =====================================================
   SPHERE STATE
===================================================== */

let currentScale = 1;
let targetScale = 1;

// Rotation NEVER stops. This is intentionally separate from the scale animation.
let rotationY = 0;
let rotationX = 0;


/* =====================================================
   CREATE SPHERE
===================================================== */

function createParticles() {
    particles.length = 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Fibonacci sphere distribution for even dot placement
        const phi = Math.acos(1 - 2 * (i + 0.5) / PARTICLE_COUNT);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;

        particles.push({
            x: Math.sin(phi) * Math.cos(theta),
            y: Math.cos(phi),
            z: Math.sin(phi) * Math.sin(theta),
            random: Math.random()
        });
    }
}

createParticles();


/* =====================================================
   DRAW PARTICLE SPHERE
===================================================== */

function drawSphere() {
    ctx.clearRect(0, 0, width, height);

    // Smooth scale transition used for mode changes
    currentScale += (targetScale - currentScale) * 0.045;

    // ROTATION NEVER STOPS
    rotationY += 0.0035;
    rotationX += 0.0004;

    const baseRadius = Math.min(width, height) * 0.36;
    const radius = baseRadius * currentScale;

    const projected = [];

    // PROJECT 3D PARTICLES INTO 2D
    for (const particle of particles) {
        let x = particle.x;
        let y = particle.y;
        let z = particle.z;

        // Y AXIS ROTATION
        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);
        const rotatedX = x * cosY - z * sinY;
        const rotatedZ = x * sinY + z * cosY;
        x = rotatedX;
        z = rotatedZ;

        // X AXIS ROTATION
        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);
        const rotatedY = y * cosX - z * sinX;
        const rotatedZ2 = y * sinX + z * cosX;
        y = rotatedY;
        z = rotatedZ2;

        // Perspective: dots closer appear bigger/brighter
        const perspective = 1 / (1.4 - z * 0.35);

        const screenX = centerX + x * radius * perspective;
        const screenY = centerY + y * radius * perspective;

        // Depth determines brightness
        const depth = (z + 1) / 2;
        const size = 0.6 + depth * 1.5;
        const opacity = 0.15 + depth * 0.8;

        projected.push({
            x: screenX,
            y: screenY,
            z: z,
            size: size,
            opacity: opacity,
            random: particle.random
        });
    }

    // Draw distant particles first
    projected.sort((a, b) => a.z - b.z);

    // DRAW DOTS
    for (const p of projected) {
        // Blue particle glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

        ctx.fillStyle = `rgba(0,190,255,${p.opacity})`;
        ctx.fill();

        // Tiny glow around closer particles
        if (p.z > 0.45) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,170,255,${p.opacity * 0.08})`;
            ctx.fill();
        }
    }

    requestAnimationFrame(drawSphere);
}

drawSphere();


/* =====================================================
   MODE SYSTEM
===================================================== */

const modeText = document.getElementById("modeText");

const modes = {
    passive: document.getElementById("passiveMode"),
    listening: document.getElementById("listeningMode"),
    thinking: document.getElementById("thinkingMode"),
    speaking: document.getElementById("speakingMode")
};


/* =====================================================
   CHANGE MODE
===================================================== */

function setMode(mode) {
    if (modeText) modeText.textContent = mode.toUpperCase();

    // Remove previous active states
    Object.values(modes).forEach(element => {
        if (element) element.classList.remove("active");
    });

    // Activate correct mode
    const selected = modes[mode.toLowerCase()];
    if (selected) selected.classList.add("active");

    // SPHERE SIZE adjustments per mode
    if (mode === "PASSIVE") {
        targetScale = 1.0; // normal size
    } else if (mode === "LISTENING") {
        targetScale = 0.78; // slightly compact
    } else if (mode === "THINKING") {
        targetScale = 0.88; // between listening and normal
    } else if (mode === "SPEAKING") {
        targetScale = 1.12; // slight expansion
    }
}


/* =====================================================
   AI ACTIVITY PANEL
===================================================== */

const activity = document.getElementById("activity");

function addActivity(message) {
    if (!activity) return;

    const line = document.createElement("div");
    line.className = "activity-line";

    line.innerHTML = `
        <span class="activity-dot"></span>
        <span>${message}</span>
    `;

    activity.prepend(line);

    // Keep the panel clean (max 8 messages)
    while (activity.children.length > 8) {
        activity.removeChild(activity.lastChild);
    }
}


/* =====================================================
   TRANSCRIPT
===================================================== */

const transcript = document.getElementById("transcript");


/* =====================================================
   SPEECH RECOGNITION
===================================================== */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;


/* =====================================================
   CHECK BROWSER SUPPORT
===================================================== */

if (SpeechRecognition) {
    recognition = new SpeechRecognition();

    /*
        IMPORTANT:
        continuous = true means the microphone remains active instead of requiring a button every time.
        We'll keep continuous listening but restart gracefully on end to support browsers that stop automatically.
    */
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // MICROPHONE STARTED
    recognition.onstart = function() {
        setMode("LISTENING");
        addActivity("Voice interface active");
    };

    // SPEECH RESULT
    recognition.onresult = function(event) {
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

        // Show what you're currently saying.
        if (transcript) transcript.textContent = interimText || finalText;

        // Final sentence received.
        if (finalText.trim()) {
            handleUserSpeech(finalText.trim());
        }
    };

    // MICROPHONE ENDED: restart to keep always-listening
    recognition.onend = function() {
        // Some browsers stop continuous recognition automatically. Restart it so JARVIS stays always listening.
        setTimeout(() => {
            try {
                recognition.start();
            } catch (error) {
                console.log("Recognition restart:", error);
            }
        }, 300);
    };

    // ERROR
    recognition.onerror = function(event) {
        console.log("Speech error:", event.error);
        addActivity(`Speech error: ${event.error}`);
    };
} else {
    if (modeText) modeText.textContent = "MIC NOT SUPPORTED";
    addActivity("Speech recognition unavailable");
}


/* =====================================================
   HANDLE USER SPEECH
===================================================== */

function handleUserSpeech(text) {
    // User has finished speaking. Move from listening into thinking.
    setMode("THINKING");

    if (transcript) transcript.textContent = text;

    addActivity("Voice input received");
    addActivity("Analyzing request...");

    // THIS is where the real AI API will eventually be connected. For now we're simulating the AI response.
    sendToAI(text);
}


/* =====================================================
   AI
===================================================== */

async function sendToAI(text) {
    // Temporary delay. Replace this section with the actual API request later.
    await wait(900);
    addActivity("Processing information...");

    await wait(900);
    addActivity("Generating response...");

    await wait(700);

    // TEMPORARY RESPONSE
    const response = "I am online and ready to assist.";

    respond(response);
}


/* =====================================================
   RESPONSE
===================================================== */

function respond(text) {
    // AI response begins. Sphere expands slightly.
    setMode("SPEAKING");

    if (transcript) transcript.textContent = text;

    addActivity("Response generated");

    speak(text);
}


/* =====================================================
   TEXT TO SPEECH
===================================================== */

function speak(text) {
    if (!window.speechSynthesis) {
        setMode("PASSIVE");
        return;
    }

    // Cancel any existing speech and speak the new text
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    speech.rate = 1;
    speech.pitch = 0.85;
    speech.volume = 1;

    speech.onstart = function() {
        setMode("SPEAKING");
    };

    speech.onend = function() {
        // Back to normal passive state. ROTATION NEVER STOPPED.
        setMode("PASSIVE");

        if (transcript) transcript.textContent = "System ready";

        addActivity("Response complete");
    };

    window.speechSynthesis.speak(speech);
}


/* =====================================================
   HELPER
===================================================== */

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


/* =====================================================
   INITIAL STATE
===================================================== */

setMode("PASSIVE");
addActivity("J.A.R.V.I.S. initialized");
addActivity("Particle core online");

// Start microphone automatically if supported.
if (recognition) {
    setTimeout(() => {
        try {
            recognition.start();
        } catch (error) {
            console.log(error);
        }
    }, 1000);
}
