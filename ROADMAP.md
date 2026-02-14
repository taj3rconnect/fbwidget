# FBWidget Roadmap

## Completed (v2.0)

- [x] Mood/satisfaction emoji rating
- [x] Screenshot annotation (draw on screenshot)
- [x] Console error/warn capture (last 10)
- [x] Network failure tracking (4xx/5xx + network errors)
- [x] API response time tracking (last 20 + average)
- [x] Pending request tracking
- [x] Rage click detection (3+ clicks same element in 1s)
- [x] Navigation path tracking (last 10 pages)
- [x] Click trail (last 10 clicks with selectors)
- [x] Page load performance timing
- [x] Memory usage (Chrome JS heap)
- [x] Session duration
- [x] Local/session storage size
- [x] Service worker & cache status
- [x] Storage quota (IndexedDB)
- [x] Form abandonment detection
- [x] Feature usage tracking (apps call `window.__fbwidget_trackFeature()`)
- [x] Browser extension detection
- [x] Modular file structure (7 frontend files, 3 backend files)
- [x] Mood in email + env TXT
- [x] Rage click alert in email subject

---

## Phase 1 — UX & Engagement

### 1.1 Dark Mode Support
Auto-detect `prefers-color-scheme: dark` and switch widget colors. Also respect host app's theme if a CSS variable like `--fbwidget-bg` is set.

### 1.2 Keyboard Shortcut
`Ctrl+Shift+F` opens/closes the widget from anywhere. Configurable via prop.

### 1.3 Auto-Save Draft
Save form state (type, title, description, priority, mood) to `sessionStorage` on every change. Restore on reopen if a draft exists. Show "Draft restored" indicator with a discard button.

### 1.4 Guided Bug Report
When type is "Bug", replace the single description textarea with 3 focused fields:
- What happened?
- What did you expect?
- Steps to reproduce

Concatenate into description on submit.

### 1.5 Voice-to-Text
Add mic button next to description textarea. Uses `webkitSpeechRecognition` / `SpeechRecognition` API. Appends transcribed text to description. Falls back gracefully if not supported.

---

## Phase 2 — Analytics & Intelligence

### 2.1 Error Replay Context
Expose `window.__fbwidget_trackState(label, snapshot)` that apps call on state changes. Stores last 5 state snapshots (stringified, truncated to 500 chars each). Included in `envInfo.stateChanges`.

### 2.2 Scroll Depth Tracking
Track max scroll depth on current page as percentage and pixels. Update on scroll events (throttled). Include `envInfo.scrollDepth` with `{ percent, pixels, pageHeight }`.

### 2.3 Idle Time Detection
Track user inactivity using mousemove/keypress/scroll listeners. Record total idle time (no input for >30s counts as idle). Include `envInfo.idleTime` and `envInfo.idleCount`.

### 2.4 Page Visibility Tracking
Listen to `visibilitychange` events. Track how many times user switched away and total hidden time. Include `envInfo.visibility` with `{ hiddenCount, totalHiddenTime }`.

### 2.5 Resource Loading Failures
Listen to `error` events on `window` (capture phase) for failed images, scripts, stylesheets. Store last 10 as `{ tagName, src, timestamp }`. Include as `envInfo.resourceFailures`.

---

## Phase 3 — Diagnostics

### 3.1 CSS Breakpoint Detection
Check `window.matchMedia` against common breakpoints (640, 768, 1024, 1280, 1536px). Report active breakpoint label (mobile/tablet/desktop/widescreen). Include as `envInfo.breakpoint`.

### 3.2 Iframe Detection
Check `window !== window.top`. If in iframe, report `envInfo.iframe` with `{ isIframe: true, parentOrigin }` (parent origin via referrer or best effort).

### 3.3 Battery Status
Use `navigator.getBattery()` to get charging state, battery level, charging/discharging time. Include as `envInfo.battery`. Graceful fallback if not supported.

### 3.4 Accessibility Quick Audit
On submit, scan visible page for:
- Images missing `alt` attribute
- Form inputs missing `label` or `aria-label`
- Buttons with no text content
- Low contrast (basic check)

Report counts as `envInfo.a11yIssues`.

### 3.5 Long Task Detection
Use `PerformanceObserver` with `longtask` entry type. Track tasks >50ms. Store last 10 with duration and attribution. Include as `envInfo.longTasks`.

---

## Phase 4 — Admin & Backend

### 4.1 Ticket Dashboard
New admin page at `/admin/feedback` with:
- Table of all tickets (sortable by date, priority, type, status)
- Filter by type, priority, status, date range
- Click to view full ticket details + attachments
- Update status (open/in-progress/resolved/closed)
- Add internal notes

### 4.2 Auto-Categorize with AI
On ticket creation, call OpenAI/Claude API to:
- Auto-tag with component area (UI, API, auth, data, etc.)
- Assess severity (cosmetic, minor, major, critical)
- Suggest priority override if AI disagrees with user's choice

Store as `ticket.aiTags` and `ticket.aiSeverity`.

### 4.3 Duplicate Detection
On submit, fuzzy-match title + description against open tickets. Use TF-IDF or embedding similarity. If match >70%, show similar tickets to user before they submit. Backend endpoint: `GET /api/feedback/similar?title=...&description=...`

### 4.4 SLA Timer
Track time from ticket creation to first response and resolution. Configure SLA targets per priority:
- High: respond in 4h, resolve in 24h
- Medium: respond in 24h, resolve in 72h
- Low: respond in 48h, resolve in 1 week

Alert via email when SLA is about to breach.

### 4.5 Webhook Notifications
Send ticket notifications to external services in addition to email:
- Slack (via incoming webhook URL)
- Discord (via webhook URL)
- Microsoft Teams (via connector URL)
- Custom webhook (any URL, POST JSON)

Configure via env vars: `FEEDBACK_SLACK_WEBHOOK`, `FEEDBACK_DISCORD_WEBHOOK`, etc.

---

## Phase 5 — User Feedback Loop

### 5.1 Ticket Status Tracking
Show user their submitted tickets with current status. Store ticket IDs in localStorage. Add "My Tickets" tab in the widget showing:
- Ticket title, status badge, submitted date
- Click to expand and see any responses

Requires new endpoint: `GET /api/feedback/:id`

### 5.2 Upvote Existing Issues
When user types a title, show similar open tickets (from Phase 4.3). Let them click "+1" to upvote instead of creating a duplicate. Show upvote count on ticket dashboard.

Requires: `POST /api/feedback/:id/upvote`

### 5.3 Satisfaction Follow-Up
After a ticket is marked resolved, auto-send email to submitter asking:
- "Was your issue resolved?" (Yes / No / Partially)
- Optional comment box

Link opens a simple web page that records the response. Track CSAT score across tickets.

Requires: new email template, `/api/feedback/:id/satisfaction` endpoint, simple response page.

---

## Implementation Priority

| Priority | Enhancement | Effort | Impact |
|----------|------------|--------|--------|
| High | 1.2 Keyboard Shortcut | Small | High |
| High | 1.3 Auto-Save Draft | Small | High |
| High | 3.5 Long Task Detection | Small | High |
| High | 2.5 Resource Loading Failures | Small | High |
| Medium | 1.1 Dark Mode | Medium | High |
| Medium | 2.2 Scroll Depth | Small | Medium |
| Medium | 2.4 Page Visibility | Small | Medium |
| Medium | 3.1 CSS Breakpoint | Small | Medium |
| Medium | 4.1 Ticket Dashboard | Large | High |
| Medium | 4.5 Webhook Notifications | Medium | High |
| Low | 1.4 Guided Bug Report | Medium | Medium |
| Low | 1.5 Voice-to-Text | Medium | Medium |
| Low | 2.1 Error Replay Context | Medium | Medium |
| Low | 2.3 Idle Time | Small | Low |
| Low | 3.2 Iframe Detection | Small | Low |
| Low | 3.3 Battery Status | Small | Low |
| Low | 3.4 A11y Audit | Medium | Medium |
| Low | 4.2 AI Categorize | Large | High |
| Low | 4.3 Duplicate Detection | Large | Medium |
| Low | 4.4 SLA Timer | Medium | Medium |
| Low | 5.1 Status Tracking | Large | High |
| Low | 5.2 Upvote Issues | Medium | Medium |
| Low | 5.3 Satisfaction Follow-Up | Medium | Medium |
