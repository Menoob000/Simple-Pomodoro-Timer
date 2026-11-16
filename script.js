const digits = document.querySelector("#clock-digits");
const timerContainer = document.querySelector(".timer-container");
const settingsInput = document.querySelectorAll(".settings-input");
const navBtn = document.querySelectorAll(".mode-btn");
const startBtn = document.querySelector(".start-btn");
const resetBtn = document.querySelector(".reset-btn");
const circle = document.querySelector("#ring-progress");

let startStatus = false;
let mode = "focus";
let timeRemaining = 0; // Tracks remaining seconds across ticks
let timerInterval = null;

// Helper: get current duration in minutes from input or placeholder
function getDuration(targetMode) {
  const input = document.querySelector(
    `.settings-input[data-key="${targetMode}"]`,
  );
  return Number(input?.value || input?.placeholder || 25);
}

// Reset timer to current mode's duration and render to screen
function resetTimer() {
  const minutes = getDuration(mode);
  timeRemaining = minutes * 60;
  renderClock();
  updateClock();
}

function updateClock() {
  const minutes = getDuration(mode) * 60;
  let r = Number(circle.getAttribute("r"));
  let circumference = 2 * Math.PI * r;
  let offset = circumference * (1 - timeRemaining / minutes);
  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = offset;
}

// Render the digits display without decrementing
function renderClock() {
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  digits.innerHTML = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// Tick function called every second
function tick() {
  if (timeRemaining <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    playAlarmBeep();
    return;
  }
  timeRemaining--;
  renderClock();
  updateClock();
}

function playAlarmBeep() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // Sound settings
  oscillator.type = "sine"; // Smooth beep sound
  oscillator.frequency.value = 880; // Pitch: A5 note (880Hz)

  // Fade out smoothly over 1 second
  gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 1);
}

// 1. Mode button click handler
navBtn.forEach((element) => {
  element.addEventListener("click", () => {
    navBtn.forEach((btn) => btn.classList.remove("active"));
    element.classList.add("active");

    mode = element.dataset.mode;
    timerContainer.dataset.mode = mode;

    resetTimer(); // Update clock when mode switches
  });
});

// 2. Settings input handler
settingsInput.forEach((input) => {
  input.addEventListener("input", () => {
    // If editing the active mode, immediately update the display
    if (input.dataset.key === mode) {
      resetTimer();
    }
  });
});

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  startStatus = true;
  startBtn.textContent = "Pause";
  timerInterval = setInterval(tick, 1000);
}

function pauseTimer() {
  startStatus = false;
  startBtn.textContent = "Start";
  clearInterval(timerInterval);
  timerInterval = null;
}

// Initialize display on load
resetTimer();

startBtn.addEventListener("click", () => {
  if (startBtn.textContent === "Start") {
    startTimer();
  } else {
    pauseTimer();
  }
});

resetBtn.addEventListener("click", () => {
  resetTimer();
  pauseTimer();
  startBtn.textContent = "Start";
});

// Make input draggable
function makeInputDraggable(input) {
  let isDragging = false;
  let startX = 0;
  let startVal = 0;
  let hasMoved = false;

  input.addEventListener("pointerdown", (e) => {
    // Only drag with left mouse button
    if (e.button !== 0) return;

    isDragging = true;
    hasMoved = false;
    startX = e.clientX;
    startVal = Number(input.value || input.placeholder || 25);

    // Locks cursor tracking to this element even if the mouse leaves the box
    input.setPointerCapture(e.pointerId);
  });

  input.addEventListener("pointermove", (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;

    // Ignore tiny tremors (so regular clicks still allow normal typing)
    if (Math.abs(deltaX) > 3) {
      hasMoved = true;
    }

    if (hasMoved) {
      // Sensitivity: 1 unit per 5 pixels dragged (adjust as desired)
      const step = Math.round(deltaX / 5);
      const min = Number(input.min) || 1;
      const max = Number(input.max) || 200;

      const newVal = Math.min(max, Math.max(min, startVal + step));
      input.value = newVal;

      // Dispatch 'input' event so your timer updates in real time
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  const stopDragging = (e) => {
    if (!isDragging) return;
    isDragging = false;

    // If dragged, blur so it doesn't open the keyboard / select text
    if (hasMoved) {
      input.blur();
    }
    input.releasePointerCapture(e.pointerId);
  };

  input.addEventListener("pointerup", stopDragging);
  input.addEventListener("pointercancel", stopDragging);
}

// Apply to all settings inputs
settingsInput.forEach(makeInputDraggable);
