/* =========================
   JARVIS CLOCK
========================= */

function updateClock() {

    const now = new Date();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    document.getElementById("time").textContent =
        `${hours}:${minutes}`;


    const day = String(now.getDate()).padStart(2, "0");

    const month = String(now.getMonth() + 1).padStart(2, "0");

    const year = now.getFullYear();

    document.getElementById("date").textContent =
        `${day}/${month}/${year}`;
}


/* Update immediately */

updateClock();


/* Update every second */

setInterval(updateClock, 1000);


/* =========================
   JARVIS CORE
========================= */

const aiCore =
    document.getElementById("aiCore");

const assistantStatus =
    document.getElementById("assistant-status");


/* =========================
   LISTENING MODE
========================= */

function startListening() {

    aiCore.classList.remove("speaking");

    aiCore.classList.add("listening");

    assistantStatus.textContent =
        "LISTENING...";
}


/* =========================
   SPEAKING MODE
========================= */

function startSpeaking() {

    aiCore.classList.remove("listening");

    aiCore.classList.add("speaking");

    assistantStatus.textContent =
        "JARVIS SPEAKING...";
}


/* =========================
   NORMAL MODE
========================= */

function stopActivity() {

    aiCore.classList.remove("listening");

    aiCore.classList.remove("speaking");

    assistantStatus.textContent =
        "SYSTEM ONLINE";
}