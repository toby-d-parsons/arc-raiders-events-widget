const API_URL =
  "https://metaforge-api.toby-d-parsons.workers.dev/events-schedule";

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
        "startTime": formatUnixTimestamp(item.startTime),
        "endTime": formatUnixTimestamp(item.endTime)
      }
    );
  }

  return transformedItems;
}

function render(model) {
  const el = document.getElementById("test");
  el.textContent = JSON.stringify(model, null, 2);
}

async function init() {
  try {
    const raw = await getSchedule();           // raw API payload
    const model = transformSchedule(raw.data); // manipulated data
    render(model);                             // display
  } catch (err) {
    console.error(err);
    document.getElementById("test").textContent = "Failed to load schedule";
  }
}

init();

function formatUnixTimestamp(ms) {
  return new Date(ms).toLocaleString("en-GB");
}