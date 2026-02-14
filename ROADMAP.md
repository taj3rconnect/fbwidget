# FBWidget Roadmap

## Completed (v2.0 — v2.2)

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
- [x] Modular file structure (7 frontend files, 4 backend files)
- [x] Mood in email + env TXT
- [x] Rage click alert in email subject
- [x] Error replay context (`window.__fbwidget_trackState()`) — v2.2
- [x] Scroll depth tracking (max %, pixels, page height) — v2.2
- [x] Idle time detection (>30s inactivity threshold) — v2.2
- [x] Page visibility tracking (tab switches, total hidden time) — v2.2
- [x] Resource loading failures (images, scripts, stylesheets) — v2.2
- [x] Webhook notifications: Slack, Discord, Teams, custom — v2.2

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

### ~~2.1 Error Replay Context~~ DONE (v2.2)
### ~~2.2 Scroll Depth Tracking~~ DONE (v2.2)
### ~~2.3 Idle Time Detection~~ DONE (v2.2)
### ~~2.4 Page Visibility Tracking~~ DONE (v2.2)
### ~~2.5 Resource Loading Failures~~ DONE (v2.2)

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

### ~~4.5 Webhook Notifications~~ DONE (v2.2)
Slack, Discord, Teams, and custom webhook support via env vars.

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

### ~~5.3 Satisfaction Follow-Up~~ DONE (v2.3)
After a ticket is marked resolved, auto-send email to submitter asking:
- "Was your issue resolved?" (Yes / No / Partially)
- Optional comment box

Link opens a simple web page that records the response. Track CSAT score across tickets.

Implemented via `feedback_followup.py`: resolve endpoint, SendGrid CSAT email, token-based HTML response pages.

---

## Implementation Priority

| Priority | Enhancement | Effort | Impact | Status |
|----------|------------|--------|--------|--------|
| High | 1.2 Keyboard Shortcut | Small | High | Pending |
| High | 1.3 Auto-Save Draft | Small | High | Pending |
| High | 3.5 Long Task Detection | Small | High | Pending |
| ~~High~~ | ~~2.5 Resource Loading Failures~~ | ~~Small~~ | ~~High~~ | **Done v2.2** |
| Medium | 1.1 Dark Mode | Medium | High | Pending |
| ~~Medium~~ | ~~2.2 Scroll Depth~~ | ~~Small~~ | ~~Medium~~ | **Done v2.2** |
| ~~Medium~~ | ~~2.4 Page Visibility~~ | ~~Small~~ | ~~Medium~~ | **Done v2.2** |
| Medium | 3.1 CSS Breakpoint | Small | Medium | Pending |
| Medium | 4.1 Ticket Dashboard | Large | High | Pending |
| ~~Medium~~ | ~~4.5 Webhook Notifications~~ | ~~Medium~~ | ~~High~~ | **Done v2.2** |
| Low | 1.4 Guided Bug Report | Medium | Medium | Pending |
| Low | 1.5 Voice-to-Text | Medium | Medium | Pending |
| ~~Low~~ | ~~2.1 Error Replay Context~~ | ~~Medium~~ | ~~Medium~~ | **Done v2.2** |
| ~~Low~~ | ~~2.3 Idle Time~~ | ~~Small~~ | ~~Low~~ | **Done v2.2** |
| Low | 3.2 Iframe Detection | Small | Low | Pending |
| Low | 3.3 Battery Status | Small | Low | Pending |
| Low | 3.4 A11y Audit | Medium | Medium | Pending |
| Low | 4.2 AI Categorize | Large | High | Pending |
| Low | 4.3 Duplicate Detection | Large | Medium | Pending |
| Low | 4.4 SLA Timer | Medium | Medium | Pending |
| Low | 5.1 Status Tracking | Large | High | Pending |
| Low | 5.2 Upvote Issues | Medium | Medium | Pending |
| ~~Low~~ | ~~5.3 Satisfaction Follow-Up~~ | ~~Medium~~ | ~~Medium~~ | **Done v2.3** |
