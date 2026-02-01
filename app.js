// =============================
// DEFINITIONS
// =============================

const API_URL = "https://metaforge-api.toby-d-parsons.workers.dev/events-schedule";
const EVENT_NAME = "Bird City";
const REFRESH_INTERVAL_MS = 3 * 60 * 1000; // First number is quantity of minutes between refresh
const STATUS_CLASSES = {
  Upcoming: ["bg-blue-600/20", "text-blue-400"],
  Ongoing: ["bg-green-600/20", "text-green-400"],
  Finished: ["bg-neutral-600/20", "text-neutral-400"],
};
const ALL_STATUS_CLASSES = Object.values(STATUS_CLASSES).flat();

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

function startCountDownForCard(dateTimeTarget, cardRef) {
  if (cardRef.intervalId) clearInterval(cardRef.intervalId);
  
  cardRef.intervalId = setInterval(() => {
    let ms = getRemainingMs(dateTimeTarget);

    cardRef.textContent = formatCountdownVerbose(msToDhms(ms), null, 2);
  }, 1000);
}

function formatCountdownVerbose(timeObject) {
  let parts = [];

  if (timeObject.days > 0) parts.push(`${timeObject.days} day${timeObject.days !== 1 ? "s" : ""}`);
  if (timeObject.hours > 0) parts.push(`${timeObject.hours}h`);
  if (timeObject.minutes > 0) parts.push(`${timeObject.minutes}m`);
  if (timeObject.seconds > 0 || parts.length === 0) parts.push(`${timeObject.seconds}s`);

  return parts.join(" ");
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

function generateDomElement(event) {
  const template = document.getElementById("event-card-template");
  const card = template.content.firstElementChild.cloneNode(true);

  card.querySelector('[data-role="event-name"]').textContent = event.name;
  card.querySelector('[data-role="event-status"]').textContent = event.status.toUpperCase();
  card.querySelector('[data-role="countdown-label"]').textContent = "--";
  card.querySelector('[data-role="event-countdown"]').textContent = "--";
  card.querySelector('[data-role="event-start-time"]').textContent = event.startTimeNormalised;
  card.querySelector('[data-role="event-end-time"]').textContent = event.endTimeNormalised;

  document.body.appendChild(card);

  return {
    event, // store the event object (or at least start/end times)
    countdownEl: card.querySelector('[data-role="event-countdown"]'),
    countdownLabel: card.querySelector('[data-role="countdown-label"]'),
    statusEl: card.querySelector('[data-role="event-status"]'),
    intervalId: null,
  };
}

function setCountdownLabel(card, statusDetails) {
  if (statusDetails = "Upcoming") {
    card.countdownLabel.textContent = "Time until start";
  } else {
    card.countdownLabel.textContent = "Time until end";
  }
}

// =============================
// RENDER DOM
// =============================

function render(schedule, cards) {
  for (let i = 0; i < schedule.length; i++) {
    let event = schedule[i];
    let remainingMs = getRemainingMs(event.startTime);
    let timeLeft = msToDhms(remainingMs);
    let statusDetails = getEventStatus(event);
    
    cards[i].statusEl.classList.remove(...ALL_STATUS_CLASSES);
    cards[i].statusEl.classList.add(...STATUS_CLASSES[statusDetails]);

    cards[i].countdownEl.textContent = formatCountdownVerbose(timeLeft);
    cards[i].statusEl.textContent = event.status.toUpperCase();

    setCountdownLabel(cards[i], statusDetails);

    let targetTime;

    if (event.startTime > new Date().getTime()) {
      targetTime = event.startTime;
    } else {
      targetTime = event.endTime;
    }

    startCountDownForCard(targetTime, cards[i].countdownEl);
  }
}

// =============================
// CONTROLLER HELPERS
// =============================

async function loadAndRender(cards) {
    const scheduleView = await refreshSchedule();
    render(scheduleView, cards);
}

async function refreshSchedule() {
  const raw = await getSchedule();
  return filterAndFormatEvents(raw.data);
}

// =============================
// INIT
// =============================

async function init() {
  const cards = [];

  let schedule = await refreshSchedule();
  for (let i = 0; i < schedule.length; i++) {
    let cardRef = generateDomElement(schedule[i]);
    cards.push(cardRef);
  }

  try {
    await loadAndRender(cards); // initial load

    // resync every x minutes
    setInterval(() => {
      loadAndRender(cards).catch(console.error);
    }, REFRESH_INTERVAL_MS);

  } catch (err) {
    console.error(err);
    document.getElementById("test").textContent = "Failed to load schedule";
  }
}

init();