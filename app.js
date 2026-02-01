const API_URL =
  "https://metaforge-api.toby-d-parsons.workers.dev/events-schedule";

let countdownIntervalId = null;

async function getSchedule() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function transformSchedule(raw) {
  let filteredItems = raw.filter(item => item.name == "Bird City");

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

function render(model) {
  const countdownEl = document.getElementById("next-event-countdown");
  const statusEl = document.getElementById("next-event-status");
  if (!countdownEl) return;
  
  const nextEvent = model[1];
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

async function init() {
  async function loadAndRender() {
    const model = await refreshSchedule();
    render(model);
  }

  try {
    await loadAndRender(); // initial load

    // resync every 3 minutes
    setInterval(() => {
      loadAndRender().catch(console.error);
    }, 3 * 60 * 1000);

  } catch (err) {
    console.error(err);
    document.getElementById("test").textContent = "Failed to load schedule";
  }
}

init();

async function refreshSchedule() {
  const raw = await getSchedule();
  const model = transformSchedule(raw.data);
  return Promise.resolve(model);
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

function getRemainingMs(targetMs) {
  let nowMs = new Date().getTime();
  let ms = targetMs - nowMs;

  return ms;
}