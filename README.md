# Arc Raiders Bird City Event Tracker

A small, client-side widget that shows **Bird City** events with a live countdown, status badge, and start/end times.

Primarily designed to be embedded via **iframe** (e.g. overlays, dashboards, or stream layouts).

---

## What it does

- Fetches schedule data from a remote API (via a Cloudflare Worker proxy)
- Filters to `EVENT_NAME = "Bird City"`
- Renders one card per event using an HTML `<template>`
- Updates each card’s countdown every second
- Switches countdown target automatically:
  - **Before start** → counts down to `startTime`
  - **After start** → counts down to `endTime`
- Refreshes schedule data periodically (default: every 3 minutes)

---

## Intended usage

- Embedded in other sites or tools via `<iframe>`
- Lightweight overlay-style component
- No external dependencies beyond the API and Tailwind CDN

The widget is fully self-contained and does not rely on any global page state, making it suitable for iframe embedding.

---

## API access

Schedule data is retrieved via a **Cloudflare Worker** endpoint, which acts as a lightweight proxy layer.

This is used to:
- Avoid CORS issues
- Decouple the client from the upstream API
- Allow future request shaping or caching if needed

---

## Tech

- Vanilla JavaScript (ES6+)
- HTML `<template>` + `data-role` hooks
- Tailwind CSS (CDN) for styling
- Cloudflare Workers (API proxy)

---

## Files

```text
.
├── index.html   # Template + page shell
├── app.js       # Fetch, transform, render, countdown logic
└── README.md

```

## Countdown behaviour

| Status    | Target time | Label            |
|----------:|------------:|------------------|
| Upcoming  | startTime   | Time until start |
| Ongoing   | endTime     | Time until end   |
| Finished  | —           | (stops updating) |