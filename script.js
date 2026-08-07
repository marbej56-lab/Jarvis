const sphere =
    document.getElementById("jarvisSphere");

const statusText =
    document.getElementById("statusText");

const transcript =
    document.getElementById("transcript");

const micButton =
    document.getElementById("micButton");

const activity =
    document.getElementById("activity");


/* =====================================
   SPEECH RECOGNITION
===================================== */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


let recognition;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();

    recognition.continuous = false;

    recognition.interimResults = true;

    recognition.lang = "en-US";


    recognition.onstart = function () {

        setMode("LISTENING");

        addActivity(
            "Microphone activated"
        );

    };


    recognition.onresult =
        function(event) {

        let text = "";

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            text +=
                event.results[i][0]
                .transcript;

        }


        transcript.textContent =
            text;


        if (
            event.results[
                event.results.length - 1
            ].isFinal
        ) {

            stopListening();

            sendToAI(text);

        }

    };


    recognition.onerror =
        function() {

        setMode("PASSIVE");

        addActivity(
            "Microphone error"
        );

    };


    recognition.onend =
        function() {

        if (
            sphere.classList
            .contains("listening")
        ) {

            stopListening();

        }

    };

}


/* =====================================
   MODE CONTROL
===================================== */

function setMode(mode) {

    sphere.classList.remove(
        "passive",
        "listening",
        "thinking",
        "speaking"
    );


    sphere.classList.add(
        mode.toLowerCase()
    );


    statusText.textContent =
        mode;


    updateLeftPanel(mode);

}


/* =====================================
   LEFT STATUS PANEL
===================================== */

function updateLeftPanel(mode) {

    const options =
        document.querySelectorAll(
            ".status-option"
        );


    options.forEach(option => {

        option.style.color =
            "rgba(255,255,255,0.25)";

    });


    if (mode === "LISTENING") {

        options[0].style.color =
            "#00cfff";

    }

    if (mode === "THINKING") {

        options[1].style.color =
            "#00cfff";

    }

    if (mode === "SPEAKING") {

        options[2].style.color =
            "#00cfff";

    }

}


/* =====================================
   ACTIVITY PANEL
===================================== */

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


    /*
       Keep only the newest 8
       activity messages.
    */

    while (
        activity.children.length > 8
    ) {

        activity.removeChild(
            activity.lastChild
        );

    }

}


/* =====================================
   START LISTENING
===================================== */

function startListening() {

    setMode("LISTENING");

    transcript.textContent =
        "Listening...";

}


/* =====================================
   STOP LISTENING
===================================== */

function stopListening() {

    sphere.classList.remove(
        "listening"
    );

    setMode("THINKING");

    transcript.textContent =
        "Processing your request...";

}


/* =====================================
   MICROPHONE BUTTON
===================================== */

micButton.addEventListener(
    "click",
    function() {

        if (!recognition) {

            alert(
                "Speech recognition is not supported in this browser."
            );

            return;

        }


        try {

            recognition.start();

        }

        catch(error) {

            console.log(error);

        }

    }
);


/* =====================================
   SEND TO AI
===================================== */

async function sendToAI(userText) {

    setMode("THINKING");


    addActivity(
        "Received voice input"
    );


    addActivity(
        "Analyzing request..."
    );


    /*
       ==================================
       YOUR AI API WILL GO HERE
       ==================================

       The AI should return a normal
       response, NOT its private reasoning.

       We can show safe status updates
       like:

       "Analyzing request"
       "Checking information"
       "Generating response"

       without exposing hidden chain-of-thought.
    */


    await new Promise(
        resolve =>
            setTimeout(resolve, 800)
    );


    addActivity(
        "Processing information..."
    );


    await new Promise(
        resolve =>
            setTimeout(resolve, 800)
    );


    addActivity(
        "Generating response..."
    );


    await new Promise(
        resolve =>
            setTimeout(resolve, 700)
    );


    /*
       TEMPORARY RESPONSE

       Replace this with the real AI
       response once we connect the API.
    */

    const aiResponse =
        "Systems are operational. How may I assist you?";


    respond(aiResponse);

}


/* =====================================
   JARVIS RESPONSE
===================================== */

function respond(text) {

    setMode("SPEAKING");


    transcript.textContent =
        text;


    addActivity(
        "Response generated"
    );


    speak(text);

}


/* =====================================
   TEXT TO SPEECH
===================================== */

function speak(text) {

    if (
        !("speechSynthesis" in window)
    ) {

        setMode("PASSIVE");

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

        addActivity(
            "Response complete"
        );


        setMode("PASSIVE");


        transcript.textContent =
            "System ready";

    };


    window.speechSynthesis.speak(
        speech
    );

}


/* =====================================
   INITIAL STATE
===================================== */

setMode("PASSIVE");

addActivity(
    "J.A.R.V.I.S. initialized"
);

addActivity(
    "All systems operational"
);