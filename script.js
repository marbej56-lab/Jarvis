/* =====================================================
   J.A.R.V.I.S.
   PARTICLE SPHERE + WAKE WORD SYSTEM
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

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    centerX = width / 2;
    centerY = height / 2;
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();


/* =====================================================
   PARTICLES
===================================================== */

const PARTICLE_COUNT = 1800;

const particles = [];

function createParticles() {

    particles.length = 0;

    for (
        let i = 0;
        i < PARTICLE_COUNT;
        i++
    ) {

        const phi =
            Math.acos(
                1 -
                2 *
                (i + 0.5) /
                PARTICLE_COUNT
            );

        const theta =
            Math.PI *
            (1 + Math.sqrt(5)) *
            i;


        particles.push({

            x:
                Math.sin(phi) *
                Math.cos(theta),

            y:
                Math.cos(phi),

            z:
                Math.sin(phi) *
                Math.sin(theta)

        });

    }
}

createParticles();


/* =====================================================
   SPHERE STATE
===================================================== */

let currentScale = 1;
let targetScale = 1;


/*
    Rotation speed changes depending
    on the current mode.
*/

let rotationY = 0;
let rotationX = 0;


/* =====================================================
   CURRENT MODE
===================================================== */

let currentMode = "PASSIVE";


/* =====================================================
   DRAW SPHERE
===================================================== */

function drawSphere() {

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    /* -----------------------------------------------
       SMOOTH SIZE ANIMATION
    ----------------------------------------------- */

    currentScale +=
        (targetScale - currentScale)
        * 0.045;


    /* -----------------------------------------------
       ROTATION SPEED
    ----------------------------------------------- */

    let rotationSpeed;


    if (currentMode === "PASSIVE") {

        /*
            VERY SLOW STANDBY ROTATION.
        */

        rotationSpeed = 0.0008;

    }

    else {

        /*
            Faster when JARVIS is active.
        */

        rotationSpeed = 0.0035;

    }


    rotationY += rotationSpeed;

    rotationX += rotationSpeed * 0.12;


    /* -----------------------------------------------
       SPHERE SIZE
    ----------------------------------------------- */

    const baseRadius =
        Math.min(
            width,
            height
        ) * 0.36;


    const radius =
        baseRadius *
        currentScale;


    const projected = [];


    /* =================================================
       PROJECT PARTICLES
    ================================================= */

    for (const particle of particles) {

        let x = particle.x;
        let y = particle.y;
        let z = particle.z;


        /* ---------------------------------------------
           Y ROTATION
        --------------------------------------------- */

        const cosY =
            Math.cos(rotationY);

        const sinY =
            Math.sin(rotationY);


        const rotatedX =
            x * cosY -
            z * sinY;

        const rotatedZ =
            x * sinY +
            z * cosY;


        x = rotatedX;
        z = rotatedZ;


        /* ---------------------------------------------
           X ROTATION
        --------------------------------------------- */

        const cosX =
            Math.cos(rotationX);

        const sinX =
            Math.sin(rotationX);


        const rotatedY =
            y * cosX -
            z * sinX;

        const rotatedZ2 =
            y * sinX +
            z * cosX;


        y = rotatedY;
        z = rotatedZ2;


        /* ---------------------------------------------
           PERSPECTIVE
        --------------------------------------------- */

        const perspective =
            1 /
            (
                1.4 -
                z * 0.35
            );


        const screenX =
            centerX +
            x *
            radius *
            perspective;


        const screenY =
            centerY +
            y *
            radius *
            perspective;


        const depth =
            (z + 1) / 2;


        /* ---------------------------------------------
           PARTICLE SIZE
        --------------------------------------------- */

        const size =
            0.6 +
            depth * 1.5;


        /* ---------------------------------------------
           PARTICLE BRIGHTNESS
        --------------------------------------------- */

        let opacity;


        if (currentMode === "PASSIVE") {

            /*
                DARKER BLUE IN STANDBY.
            */

            opacity =
                0.07 +
                depth * 0.38;

        }

        else {

            /*
                Normal bright blue when active.
            */

            opacity =
                0.15 +
                depth * 0.8;

        }


        projected.push({

            x: screenX,

            y: screenY,

            z: z,

            size: size,

            opacity: opacity

        });

    }


    /* -----------------------------------------------
       BACK → FRONT
    ----------------------------------------------- */

    projected.sort(
        (a, b) =>
            a.z - b.z
    );


    /* =================================================
       DRAW PARTICLES
    ================================================= */

    for (const p of projected) {

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );


        /*
            Standby = dark blue
            Active = brighter cyan blue
        */

        if (currentMode === "PASSIVE") {

            ctx.fillStyle =
                `rgba(
                    0,
                    80,
                    150,
                    ${p.opacity}
                )`;

        }

        else {

            ctx.fillStyle =
                `rgba(
                    0,
                    190,
                    255,
                    ${p.opacity}
                )`;

        }


        ctx.fill();


        /* ---------------------------------------------
           SUBTLE GLOW
        --------------------------------------------- */

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
                `rgba(
                    0,
                    170,
                    255,
                    ${p.opacity * 0.08}
                )`;


            ctx.fill();

        }

    }


    requestAnimationFrame(drawSphere);

}


drawSphere();


/* =====================================================
   MODE UI
===================================================== */

const modeText =
    document.getElementById("modeText");


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


/* =====================================================
   SET MODE
===================================================== */

function setMode(mode) {

    currentMode =
        mode.toUpperCase();


    modeText.textContent =
        currentMode;


    Object.values(modes)
        .forEach(element => {

            if (element) {

                element.classList
                    .remove("active");

            }

        });


    const selected =
        modes[
            mode.toLowerCase()
        ];


    if (selected) {

        selected.classList
            .add("active");

    }


    /* -----------------------------------------------
       SPHERE SIZE
    ----------------------------------------------- */

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
   AI ACTIVITY
===================================================== */

const activity =
    document.getElementById("activity");


function addActivity(message) {

    const line =
        document.createElement("div");


    line.className =
        "activity-line";


    line.innerHTML = `

        <span class="activity-dot"></span>

        <span>${message}</span>

    `;


    activity.prepend(line);


    while (
        activity.children.length > 8
    ) {

        activity.removeChild(
            activity.lastChild
        );

    }

}


/* =====================================================
   TRANSCRIPT
===================================================== */

const transcript =
    document.getElementById("transcript");


/* =====================================================
   WAKE WORD SYSTEM
===================================================== */

let activeSession = false;

let aiBusy = false;


/*
    45 seconds of inactivity.
*/

const INACTIVITY_TIME =
    45 * 1000;


let inactivityTimer = null;


/* =====================================================
   SPEECH RECOGNITION
===================================================== */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


let recognition;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();


    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.lang = "en-US";


    /* -----------------------------------------------
       START
    ----------------------------------------------- */

    recognition.onstart =
        function() {

        if (!activeSession) {

            setMode("PASSIVE");

            transcript.textContent =
                'Say "Jarvis" to activate';

        }

    };


    /* -----------------------------------------------
       RESULT
    ----------------------------------------------- */

    recognition.onresult =
        function(event) {

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

            }

            else {

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


        /* -------------------------------------------
           STANDBY
        ------------------------------------------- */

        if (!activeSession) {

            if (
                spoken.includes("jarvis")
            ) {

                activateJarvis(
                    spoken
                );

            }

            return;

        }


        /* -------------------------------------------
           ACTIVE
        ------------------------------------------- */

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


    /* -----------------------------------------------
       END
    ----------------------------------------------- */

    recognition.onend =
        function() {

        setTimeout(() => {

            try {

                recognition.start();

            }

            catch(error) {

                console.log(error);

            }

        }, 300);

    };


    /* -----------------------------------------------
       ERROR
    ----------------------------------------------- */

    recognition.onerror =
        function(event) {

        console.log(
            "Speech recognition error:",
            event.error
        );

    };

}


/* =====================================================
   ACTIVATE JARVIS
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
                /\bjarvis\b/i,
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
   45 SECOND TIMER
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
        "45 seconds of inactivity"
    );


    addActivity(
        "Returning to standby"
    );

}


/* =====================================================
   USER SPEECH
===================================================== */

function handleUserSpeech(text) {

    if (!activeSession) {

        return;

    }


    if (aiBusy) {

        return;

    }


    setMode("LISTENING");


    transcript.textContent =
        text;


    resetInactivityTimer();


    addActivity(
        "Voice input received"
    );


    sendToAI(text);

}


/* =====================================================
   AI
===================================================== */

async function sendToAI(text) {

    aiBusy = true;


    setMode("THINKING");


    addActivity(
        "Analyzing request..."
    );


    await wait(900);


    addActivity(
        "Processing information..."
    );


    await wait(900);


    addActivity(
        "Generating response..."
    );


    await wait(700);


    /*
        TEMPORARY RESPONSE.
    */

    const response =
        "Yes, I'm listening. How can I help?";


    respond(response);

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


    speech.onstart =
        function() {

        setMode("SPEAKING");

    };


    speech.onend =
        function() {

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
   HELPER
===================================================== */

function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


/* =====================================================
   INITIAL STATE
===================================================== */

setMode("PASSIVE");


transcript.textContent =
    'Say "Jarvis" to activate';


addActivity(
    "J.A.R.V.I.S. initialized"
);


addActivity(
    "Particle core online"
);


addActivity(
    'Waiting for wake word: "Jarvis"'
);


/* =====================================================
   START MICROPHONE
===================================================== */

if (recognition) {

    setTimeout(() => {

        try {

            recognition.start();

        }

        catch(error) {

            console.log(error);

        }

    }, 1000);

}