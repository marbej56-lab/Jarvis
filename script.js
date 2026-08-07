/* =========================
   JARVIS — script.js
   Added DOMContentLoaded wrapper and null-checks for safe execution
========================= */

document.addEventListener('DOMContentLoaded', () => {
  /* =========================
     JARVIS CLOCK
  ========================= */
  function updateClock() {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const timeEl = document.getElementById('time');
    if (timeEl) timeEl.textContent = `${hours}:${minutes}`;

    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    const dateEl = document.getElementById('date');
    if (dateEl) dateEl.textContent = `${day}/${month}/${year}`;
  }

  /* Update immediately and every second */
  updateClock();
  setInterval(updateClock, 1000);


  /* =========================
     JARVIS CORE
  ========================= */
  const aiCore = document.getElementById('aiCore');
  const assistantStatus = document.getElementById('assistant-status');

  /* =========================
     LISTENING MODE
  ========================= */
  function startListening() {
    if (aiCore) {
      aiCore.classList.remove('speaking');
      aiCore.classList.add('listening');
    }

    if (assistantStatus) assistantStatus.textContent = 'LISTENING...';
  }

  /* =========================
     SPEAKING MODE
  ========================= */
  function startSpeaking() {
    if (aiCore) {
      aiCore.classList.remove('listening');
      aiCore.classList.add('speaking');
    }

    if (assistantStatus) assistantStatus.textContent = 'JARVIS SPEAKING...';
  }

  /* =========================
     NORMAL MODE
  ========================= */
  function stopActivity() {
    if (aiCore) {
      aiCore.classList.remove('listening');
      aiCore.classList.remove('speaking');
    }

    if (assistantStatus) assistantStatus.textContent = 'SYSTEM ONLINE';
  }

  /* Expose controls for testing from the console */
  window.updateClock = updateClock;
  window.startListening = startListening;
  window.startSpeaking = startSpeaking;
  window.stopActivity = stopActivity;
});
