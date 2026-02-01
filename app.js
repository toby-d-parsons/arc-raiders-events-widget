// =============================
// DEFINITIONS
// =============================

const API_URL = "https://metaforge-api.toby-d-parsons.workers.dev/events-schedule";
const EVENT_NAME = "Bird City";
const REFRESH_INTERVAL_MS = 0.05 * 60 * 1000; // First number is quantity of minutes between refresh

let countdownIntervalId = null;

// =============================
// DATA ACCESS
// =============================


async function getSchedule() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// =============================
// HELPERS
// =============================

function filterAndFormatEvents(raw) {
  let filteredItems = raw.filter(item => item.name == EVENT_NAME);

  var transformedItems = []
  for (let i = 0; i < filteredItems.length; i++) {
    let item = filteredItems[i];

    transformedItems.push(
      {
        "name": item.name,
        "map": item.map,
        "startTime": item.startTime,
        "endTime": item.endTime,
        "startTimeNormalised": formatUnixTimestamp(item.startTime),
        "endTimeNormalised": formatUnixTimestamp(item.endTime),
        "status": getEventStatus(item)
      }
    );
  }

  return transformedItems;
}

function getEventStatus(event) {
  let nowMs = new Date().getTime()
  if (nowMs > event.endTime) {
    return "Finished";
  } else if (nowMs < event.startTime) {
    return "Upcoming";
  } else {
    return "Ongoing";
  }
}

function getRemainingMs(targetMs) {
  let nowMs = new Date().getTime();
  let ms = targetMs - nowMs;

  return ms;
}

function formatUnixTimestamp(ms) {
  return new Date(ms).toLocaleString("en-GB");
}

function startCountDownForElement(dateTimeTarget, elementId) {
  if (countdownIntervalId) clearInterval(countdownIntervalId);
  
  countdownIntervalId = setInterval(() => {
    let ms = getRemainingMs(dateTimeTarget);
    let element = document.getElementById(elementId);

    element.textContent = JSON.stringify(msToDhms(ms), null, 2);
  }, 1000);
}

function msToDhms(ms) {
  if (ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(ms / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

// =============================
// RENDER DOM
// =============================

function render(schedule) {
  const countdownEl = document.getElementById("next-event-countdown");
  const statusEl = document.getElementById("next-event-status");
  if (!countdownEl || !statusEl) return;
  
  const nextEvent = schedule[0];
  if (!nextEvent) {
    countdownEl.textContent = "No upcoming events";
    return;
  }

  let remainingMs = getRemainingMs(nextEvent.startTime);
  let timeLeft = msToDhms(remainingMs);

  countdownEl.textContent = JSON.stringify(timeLeft, null, 2);
  statusEl.textContent = nextEvent.status.toUpperCase();
  startCountDownForElement(nextEvent.startTime, "next-event-countdown");
}

// =============================
// CONTROLLER HELPERS
// =============================

async function loadAndRender() {
    const scheduleView = await refreshSchedule();
    render(scheduleView);
}

async function refreshSchedule() {
  const raw = await getSchedule();
  return filterAndFormatEvents(raw.data);
}

// =============================
// INIT
// =============================

async function init() {
  try {
    await loadAndRender(); // initial load

    // resync every x minutes
    setInterval(() => {
      loadAndRender().catch(console.error);
    }, REFRESH_INTERVAL_MS);

  } catch (err) {
    console.error(err);
    document.getElementById("test").textContent = "Failed to load schedule";
  }
}

init();