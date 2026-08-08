/* =====================================================
   J.A.R.V.I.S.
   VOICE AI CORE
===================================================== */

const canvas = document.getElementById("sphere");
const ctx = canvas.getContext("2d");

let width;
let height;
let centerX;
let centerY;


/* =====================================================
   CANVAS
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
   PARTICLE SPHERE
===================================================== */

const PARTICLE_COUNT = 1800;
const particles = [];

function createParticles() {

    particles.length = 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {

        const phi =
            Math.acos(
                1 -
                2 * (i + 0.5) / PARTICLE_COUNT
            );

        const theta =
            Math.PI *
            (1 + Math.sqrt(5)) *
            i;

        particles.push({
            x: Math.sin(phi) * Math.cos(theta),
            y: Math.cos(phi),
            z: Math.sin(phi) * Math.sin(theta)
        });
    }
}

createParticles();


let currentScale = 1;
let targetScale = 1;

let rotationY = 0;
let rotationX = 0;

let currentMode = "PASSIVE";


function drawSphere() {

    ctx.clearRect(0, 0, width, height);

    currentScale +=
        (targetScale - currentScale) * 0.045;

    const rotationSpeed =
        currentMode === "PASSIVE"
            ? 0.0008
            : 0.0035;

    rotationY += rotationSpeed;
    rotationX += rotationSpeed * 0.12;

    const baseRadius =
        Math.min(width, height) * 0.36;

    const radius =
        baseRadius * currentScale;

    const projected = [];

    for (const particle of particles) {

        let x = particle.x;
        let y = particle.y;
        let z = particle.z;

        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);

        const rotatedX =
            x * cosY - z * sinY;

        const rotatedZ =
            x * sinY + z * cosY;

        x = rotatedX;
        z = rotatedZ;

        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);

        const rotatedY =
            y * cosX - z * sinX;

        const rotatedZ2 =
            y * sinX + z * cosX;

        y = rotatedY;
        z = rotatedZ2;

        const perspective =
            1 / (1.4 - z * 0.35);

        const screenX =
            centerX +
            x * radius * perspective;

        const screenY =
            centerY +
            y * radius * perspective;

        const depth = (z + 1) / 2;

        const size =
            0.6 + depth * 1.5;

        const opacity =
            currentMode === "PASSIVE"
                ? 0.07 + depth * 0.38
                : 0.15 + depth * 0.8;

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

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        if (currentMode === "PASSIVE") {

            ctx.fillStyle =
                `rgba(0,80,150,${p.opacity})`;

        } else {

            ctx.fillStyle =
                `rgba(0,190,255,${p.opacity})`;
        }

        ctx.fill();

        if (
            p.z > 0.45 &&
            currentMode !== "PASSIVE"
        ) {

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                p.size * 2.5,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(0,170,255,${p.opacity * 0.08})`;

            ctx.fill();
        }
    }

    requestAnimationFrame(drawSphere);
}

drawSphere();


/* =====================================================
   UI
===================================================== */

const modeText =
    document.getElementById("modeText");

const transcript =
    document.getElementById("transcript");

const activity =
    document.getElementById("activity");

const modes = {

    passive:
        document.getElementById("passiveMode"),

    listening:
        document.getElementById("listeningMode"),

    thinking:
        document.getElementById("thinkingMode"),

    speaking:
        document.getElementById("speakingMode")
};


function setMode(mode) {

    currentMode = mode.toUpperCase();

    if (modeText)
        modeText.textContent = currentMode;

    Object.values(modes).forEach(element => {

        if (element)
            element.classList.remove("active");

    });

    const selected =
        modes[mode.toLowerCase()];

    if (selected)
        selected.classList.add("active");

    switch (currentMode) {

        case "PASSIVE":
            targetScale = 1.0;
            break;

        case "LISTENING":
            targetScale = 0.78;
            break;

        case "THINKING":
            targetScale = 0.88;
            break;

        case "SPEAKING":
            targetScale = 1.12;
            break;
    }
}


/* =====================================================
   ACTIVITY
===================================================== */

function addActivity(message) {

    if (!activity)
        return;

    const line =
        document.createElement("div");

    line.className =
        "activity-line";

    const dot =
        document.createElement("span");

    dot.className =
        "activity-dot";

    const text =
        document.createElement("span");

    text.textContent = message;

    line.appendChild(dot);
    line.appendChild(text);

    activity.prepend(line);

    while (activity.children.length > 8) {

        activity.removeChild(
            activity.lastChild
        );
    }
}


/* =====================================================
   VOICE SYSTEM
===================================================== */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;

let microphoneStarted = false;

let activeSession = false;

let aiBusy = false;

let inactivityTimer = null;

const INACTIVITY_TIME =
    45 * 1000;


/* =====================================================
   CONVERSATION MEMORY
===================================================== */

let conversation = [];


/* =====================================================
   DATE / TIME CONTEXT
===================================================== */

function getTimeContext() {

    const now = new Date();

    return {

        date:
            now.toLocaleDateString(),

        time:
            now.toLocaleTimeString(),

        day:
            now.toLocaleDateString(
                undefined,
                { weekday: "long" }
            ),

        timezone:
            Intl.DateTimeFormat()
                .resolvedOptions()
                .timeZone
    };
}


/* =====================================================
   SPEECH RECOGNITION SETUP
===================================================== */

if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();

    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.lang = "en-US";


    recognition.onstart = function () {

        microphoneStarted = true;

        addActivity(
            "Microphone online"
        );

        if (!activeSession) {

            setMode("PASSIVE");

            transcript.textContent =
                'Say "Jarvis" to activate';
        }
    };


    recognition.onresult = function (event) {

        let finalText = "";
        let interimText = "";

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            const text =
                event.results[i][0]
                    .transcript;

            if (
                event.results[i].isFinal
            ) {

                finalText += text;

            } else {

                interimText += text;
            }
        }


        const spoken =
            (
                finalText ||
                interimText
            )
            .toLowerCase()
            .trim();


        /* =========================================
           PASSIVE
        ========================================= */

        if (!activeSession) {

            if (
                spoken.includes("jarvis")
            ) {

                activateJarvis(spoken);
            }

            return;
        }


        /* =========================================
           ACTIVE
        ========================================= */

        if (interimText) {

            transcript.textContent =
                interimText;
        }

        resetInactivityTimer();


        if (
            finalText.trim() &&
            !aiBusy
        ) {

            handleUserSpeech(
                finalText.trim()
            );
        }
    };


    recognition.onend = function () {

        if (!microphoneStarted)
            return;

        setTimeout(() => {

            try {

                recognition.start();

            } catch (error) {

                console.log(
                    "Recognition restart:",
                    error
                );
            }

        }, 300);
    };


    recognition.onerror = function (event) {

        console.log(
            "Speech recognition error:",
            event.error
        );

        if (
            event.error === "not-allowed"
        ) {

            transcript.textContent =
                "Microphone permission required";

            addActivity(
                "Microphone permission denied"
            );
        }
    };
}


/* =====================================================
   START MICROPHONE
===================================================== */

async function startMicrophone() {

    if (!recognition) {

        transcript.textContent =
            "Speech recognition is not supported";

        addActivity(
            "Speech recognition unavailable"
        );

        return;
    }

    try {

        /*
         * Ask Safari for microphone permission.
         */

        if (
            navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia
        ) {

            const stream =
                await navigator.mediaDevices
                    .getUserMedia({
                        audio: true
                    });

            stream
                .getTracks()
                .forEach(track =>
                    track.stop()
                );
        }

        microphoneStarted = true;

        try {

            recognition.start();

        } catch (error) {

            console.log(error);
        }

    } catch (error) {

        console.log(
            "Microphone permission:",
            error
        );

        transcript.textContent =
            "Allow microphone access in Safari";

        addActivity(
            "Microphone permission required"
        );
    }
}


/* =====================================================
   WAKE WORD
===================================================== */

function activateJarvis(spokenText) {

    activeSession = true;

    resetInactivityTimer();

    setMode("LISTENING");

    addActivity(
        "Wake word detected"
    );

    addActivity(
        "Voice interface activated"
    );

    transcript.textContent =
        "I'm listening";


    const command =
        spokenText
            .replace(
                /\bjarvis\b/gi,
                ""
            )
            .trim();


    if (
        command.length > 2
    ) {

        handleUserSpeech(
            command
        );
    }
}


/* =====================================================
   INACTIVITY TIMER
===================================================== */

function resetInactivityTimer() {

    clearTimeout(
        inactivityTimer
    );

    inactivityTimer =
        setTimeout(
            goToStandby,
            INACTIVITY_TIME
        );
}


/* =====================================================
   STANDBY
===================================================== */

function goToStandby() {

    activeSession = false;

    aiBusy = false;

    setMode("PASSIVE");

    transcript.textContent =
        'Say "Jarvis" to activate';

    addActivity(
        "Returning to standby"
    );
}


/* =====================================================
   USER SPEECH
===================================================== */

function handleUserSpeech(text) {

    if (!activeSession)
        return;

    if (aiBusy)
        return;

    setMode("THINKING");

    transcript.textContent =
        text;

    resetInactivityTimer();

    addActivity(
        "Voice input received"
    );

    sendToAI(text);
}


/* =====================================================
   SEND TO CLOUDFLARE / GEMINI
===================================================== */

async function sendToAI(text) {

    aiBusy = true;

    setMode("THINKING");

    addActivity(
        "Connecting to AI core..."
    );


    const time =
        getTimeContext();


    /*
     * Give the AI useful real-world context.
     */

    const systemContext = `
You are J.A.R.V.I.S., a voice assistant.

CURRENT DATE:
${time.date}

CURRENT TIME:
${time.time}

DAY:
${time.day}

TIMEZONE:
${time.timezone}

You are communicating through a voice interface.

Keep normal answers concise and natural because
your response will be spoken aloud.

You can understand commands involving the website
interface.

If the user asks for the current time or date,
use the supplied current time/date.

Do not claim to have performed an action unless
the website actually performed it.
`;


    conversation.push({

        role: "user",

        text: text
    });


    /*
     * Keep the conversation from becoming enormous.
     */

    if (conversation.length > 12) {

        conversation =
            conversation.slice(-12);
    }


    try {

        const response =
            await fetch(
                "https://jrv.marcbejjani456.workers.dev/",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        prompt:
                            systemContext +
                            "\n\nConversation:\n" +
                            conversation
                                .map(
                                    message =>
                                        message.role +
                                        ": " +
                                        message.text
                                )
                                .join("\n") +
                            "\n\nUSER:\n" +
                            text
                    })
                }
            );


        const data =
            await response.json();


        if (
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts &&
            data.candidates[0].content.parts[0]
        ) {

            const aiText =
                data.candidates[0]
                    .content
                    .parts[0]
                    .text;


            conversation.push({

                role: "assistant",

                text: aiText
            });


            addActivity(
                "AI response received"
            );


            respond(aiText);

        }

        else if (data.error) {

            throw new Error(
                data.error.message ||
                JSON.stringify(data.error)
            );

        }

        else {

            throw new Error(
                "Empty AI response"
            );
        }


    } catch (error) {

        console.error(error);

        aiBusy = false;

        setMode("LISTENING");

        transcript.textContent =
            "I couldn't connect to the AI core.";

        addActivity(
            "AI connection error"
        );

        resetInactivityTimer();
    }
}


/* =====================================================
   RESPONSE
===================================================== */

function respond(text) {

    aiBusy = false;

    setMode("SPEAKING");

    transcript.textContent =
        text;

    addActivity(
        "Response generated"
    );

    resetInactivityTimer();

    speak(text);
}


/* =====================================================
   TEXT TO SPEECH
===================================================== */

function speak(text) {

    if (
        !window.speechSynthesis
    ) {

        setMode("LISTENING");

        return;
    }


    window.speechSynthesis.cancel();


    const speech =
        new SpeechSynthesisUtterance(
            text
        );


    speech.rate = 1;

    speech.pitch = 0.85;

    speech.volume = 1;


    speech.onstart = function () {

        setMode("SPEAKING");
    };


    speech.onend = function () {

        if (!activeSession)
            return;

        setMode("LISTENING");

        transcript.textContent =
            "I'm listening";

        addActivity(
            "Listening for next command"
        );

        resetInactivityTimer();
    };


    window.speechSynthesis.speak(
        speech
    );
}


/* =====================================================
   WEBSITE CONTROL SYSTEM
===================================================== */

/*
 * These are SAFE website controls.
 *
 * The AI can eventually request these actions
 * through the Cloudflare Worker.
 */

window.JARVIS = {

    setTheme: function (theme) {

        if (theme === "dark") {

            document.body.style.background =
                "#000";

        }

        if (theme === "blue") {

            document.body.style.background =
                "radial-gradient(circle, #001a30, #000)";
        }
    },


    setName: function (name) {

        const element =
            document.querySelector(".name");

        if (element)
            element.textContent = name;
    },


    setTranscript: function (text) {

        if (transcript)
            transcript.textContent = text;
    },


    setScale: function (scale) {

        targetScale = Number(scale) || 1;
    },


    setMode: function (mode) {

        setMode(mode);
    },


    addActivity: function (text) {

        addActivity(text);
    }
};


/* =====================================================
   INITIALIZATION
===================================================== */

setMode("PASSIVE");

transcript.textContent =
    'Tap once, allow microphone, then say "Jarvis"';

addActivity(
    "J.A.R.V.I.S. initialized"
);

addActivity(
    "Particle core online"
);

addActivity(
    "AI core ready"
);


/*
 * Safari normally requires a user interaction
 * before microphone access.
 */

document.addEventListener(
    "click",
    function startOnce() {

        startMicrophone();

        document.removeEventListener(
            "click",
            startOnce
        );

    },
    { once: true }
);
