# fbwidget — Feedback Widget Plugin for Claude Code

A Claude Code plugin that adds a feedback/support chat widget to any web project.

## Installation

The plugin is installed at `~/.claude/plugins/fbwidget/` and available globally.

## Usage

In any web project, run:

```
/fbwidget:add
```

Claude will:
1. Detect your framework (React, Vue, or vanilla HTML)
2. Copy the appropriate widget component into your project
3. Set up the backend API for handling submissions and email notifications
4. Create the feedback storage directory
5. Generate `.env` config for SMTP settings
6. Optionally integrate with GitHub Issues

## Features

- **Floating widget** — bottom-right corner button that opens a slide-out panel
- **Ticket types** — Bug Report, Feature Request, Question, Support Ticket
- **Priority levels** — Low, Medium, High
- **File attachments** — paste from clipboard, drag & drop, or browse
- **Supported files** — PNG, JPG, GIF, PDF, TXT, LOG (max 10MB each)
- **Image previews** — thumbnail previews before submitting
- **Auto-capture** — current URL, browser info, OS, screen resolution, timestamp
- **Email notifications** — HTML emails with inline image previews and all attachments
- **Local storage** — JSON files in `/feedback/` directory
- **GitHub Issues** — optional integration to auto-create issues

## Environment Variables

```env
FEEDBACK_SMTP_HOST=smtp.gmail.com
FEEDBACK_SMTP_PORT=587
FEEDBACK_SMTP_USER=your@email.com
FEEDBACK_SMTP_PASS=your-app-password
FEEDBACK_EMAIL_TO=support@yourcompany.com
FEEDBACK_EMAIL_FROM=noreply@yourcompany.com
FEEDBACK_APP_NAME=MyApp

# Optional
FEEDBACK_GITHUB_REPO=owner/repo
FEEDBACK_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

## Templates

| File | Description |
|------|-------------|
| `FBWidget.jsx` | React component |
| `FBWidget.vue` | Vue component |
| `fbwidget.html` | Vanilla HTML/JS (inject before `</body>`) |
| `fbwidget-api.js` | Node/Express backend API |
| `.env.example` | Environment variable template |
