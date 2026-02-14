# Add Feedback Widget (/fbwidget:add)

You are adding a feedback/support chat widget to the current project. Follow these steps precisely.

## Step 1: Detect Project Type

Scan the current working directory to determine the framework:

1. **React** — Look for `package.json` with `react` dependency, or `src/App.jsx`/`src/App.tsx` files
2. **Vue** — Look for `package.json` with `vue` dependency, or `src/App.vue` files
3. **Vanilla HTML** — Look for `index.html` in root, or no framework detected

Tell the user which framework was detected and proceed.

## Step 2: Copy Templates

The plugin templates are located at: `~/.claude/plugins/fbwidget/templates/`

Based on the detected framework:

### React Project
1. Copy `FBWidget.jsx` to the project's component directory (e.g., `src/components/FBWidget.jsx`)
2. Add `<FBWidget />` to the app's root layout component (e.g., `App.jsx`, `App.tsx`, or the main layout file)
3. Import the component: `import { FBWidget } from './components/FBWidget'`
4. Place it just before the closing tag of the root element so it renders as an overlay
5. Update the `BACKEND_URL` or `apiUrl` to match the project's backend URL pattern

### Vue Project
1. Copy `FBWidget.vue` to `src/components/FBWidget.vue`
2. Add `<FBWidget />` to `App.vue` template
3. Import and register the component in `App.vue`

### Vanilla HTML Project
1. Copy `fbwidget.html` contents — extract the `<style>`, `<div id="fb-widget-root">`, and `<script>` blocks
2. Inject them into the project's main `index.html` before `</body>`

## Step 3: Set Up Backend API

### If the project uses Node.js/Express backend:
1. Copy `fbwidget-api.js` from templates to the project's backend
2. Install: `npm install @sendgrid/mail multer uuid`
3. Add the router to the Express app: `app.use('/api', feedbackRouter)`

### If the project uses Python/FastAPI backend:
1. Create `feedback_api.py` with a `POST /api/feedback` endpoint that:
   - Accepts multipart form data (type, title, description, priority, name, email, url, timestamp, userAgent, screen, platform, attachments)
   - Saves ticket as JSON in `feedback/` directory
   - Saves attachments in `feedback/attachments/{ticket-id}/`
   - Sends email via SendGrid API using the `sendgrid` Python package
   - HTML email includes: ticket info table, description, inline image previews via CID, all files as attachments
2. Install: `pip install sendgrid`
3. Import and register the router in the main server file: `app.include_router(feedback_router)`

## Step 4: Create Storage Directory

```bash
mkdir -p feedback/attachments
```

Add `feedback/` to `.gitignore` (don't commit user submissions).

## Step 5: Environment Configuration

1. If a `.env` file exists, append the feedback variables (don't overwrite existing vars)
2. If no `.env` exists, create one from the template
3. Tell the user to fill in their SendGrid API key

The required env vars:
```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
FEEDBACK_EMAIL_TO=support@yourcompany.com
FEEDBACK_EMAIL_FROM=noreply@yourcompany.com
FEEDBACK_APP_NAME=MyApp
```

## Step 6: Wire Up API URL

Update the widget component's API endpoint to match the project's backend:
- Default: `/api/feedback`
- If the project uses a different API prefix (e.g., `/api/v1`), adjust accordingly
- If frontend and backend run on different ports, use the full backend URL (e.g., via env var like `REACT_APP_BACKEND_URL`)

## Step 7 (Optional): GitHub Issues Integration

Ask the user: "Do you want to also create GitHub Issues for each feedback submission?"

If yes:
1. Add `FEEDBACK_GITHUB_REPO=owner/repo` and `FEEDBACK_GITHUB_TOKEN=ghp_...` to `.env`
2. Add GitHub issue creation logic to the API handler using the GitHub REST API
3. Map ticket types to GitHub labels (bug → bug, feature → enhancement, question → question, support → help wanted)

## Step 8: Summary

After setup, tell the user:
1. Which files were created/modified
2. What packages need to be installed (if not auto-installed)
3. Remind them to configure `.env` with their SendGrid API key
4. How to test: open the app, click the floating button in the bottom-right corner
5. Where submissions are stored: `./feedback/` directory
