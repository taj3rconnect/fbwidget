/**
 * FBWidget Backend API - Node.js/Express
 * Handles feedback submissions with file attachments and SendGrid email notifications.
 *
 * Usage:
 *   const feedbackRouter = require('./fbwidget-api');
 *   app.use('/api', feedbackRouter);
 *
 * Required packages: npm install @sendgrid/mail multer uuid
 * Required env vars: see .env.example
 */

const express = require('express');
const multer = require('multer');
const sgMail = require('@sendgrid/mail');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Storage config
const FEEDBACK_DIR = path.join(process.cwd(), 'feedback');
const ATTACHMENTS_DIR = path.join(FEEDBACK_DIR, 'attachments');

fs.mkdirSync(FEEDBACK_DIR, { recursive: true });
fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });

// Multer config
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.txt', '.log'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// Type labels
const TYPE_LABELS = {
  bug: 'Bug Report',
  feature: 'Feature Request',
  question: 'Question',
  support: 'Support Ticket',
};

const PRIORITY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };

// POST /api/feedback
router.post('/feedback', upload.array('attachments', 20), async (req, res) => {
  try {
    const { type, title, description, priority, name, email, url, timestamp, userAgent, screen, platform } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const ticketId = `${ts}-${uuidv4().slice(0, 8)}`;
    const ticketDir = path.join(ATTACHMENTS_DIR, ticketId);

    const savedFiles = [];
    if (req.files && req.files.length > 0) {
      fs.mkdirSync(ticketDir, { recursive: true });
      for (const file of req.files) {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = path.join(ticketDir, safeName);
        fs.writeFileSync(filePath, file.buffer);
        savedFiles.push({ name: safeName, size: file.size, type: file.mimetype, path: filePath, buffer: file.buffer });
      }
    }

    const ticket = {
      id: ticketId,
      type: type || 'support',
      title,
      description,
      priority: priority || 'medium',
      submitter: { name: name || 'Anonymous', email: email || '' },
      context: { url: url || '', userAgent: userAgent || '', screen: screen || '', platform: platform || '' },
      attachments: savedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
      timestamp: timestamp || new Date().toISOString(),
      status: 'open',
    };

    const ticketPath = path.join(FEEDBACK_DIR, `${ticketId}.json`);
    fs.writeFileSync(ticketPath, JSON.stringify(ticket, null, 2));

    await sendEmailNotification(ticket, savedFiles);
    await createGitHubIssue(ticket);

    res.json({ success: true, ticketId });
  } catch (err) {
    console.error('[FBWidget] Error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

async function sendEmailNotification(ticket, files) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) { console.warn('[FBWidget] SENDGRID_API_KEY not set — skipping email.'); return; }

  const to = process.env.FEEDBACK_EMAIL_TO;
  const from = process.env.FEEDBACK_EMAIL_FROM;
  if (!to || !from) { console.warn('[FBWidget] FEEDBACK_EMAIL_TO or FEEDBACK_EMAIL_FROM not set.'); return; }

  sgMail.setApiKey(apiKey);

  const appName = process.env.FEEDBACK_APP_NAME || 'App';
  const priorityColor = PRIORITY_COLORS[ticket.priority] || '#6b7280';
  const typeLabel = TYPE_LABELS[ticket.type] || ticket.type;

  const sgAttachments = files.map(f => ({
    content: f.buffer.toString('base64'),
    filename: f.name,
    type: f.type,
    disposition: f.type.startsWith('image/') ? 'inline' : 'attachment',
    content_id: f.type.startsWith('image/') ? f.name : undefined,
  }));

  const imagePreviewsHtml = files
    .filter(f => f.type.startsWith('image/'))
    .map(f => `<div style="margin:8px 0"><img src="cid:${f.name}" style="max-width:400px;max-height:300px;border:1px solid #e5e7eb;border-radius:8px" /><br/><small style="color:#6b7280">${f.name}</small></div>`)
    .join('');

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#2563eb;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
        <h2 style="margin:0;font-size:18px">${appName} — New Feedback</h2>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 12px;color:#6b7280;width:100px">Type</td><td style="padding:8px 12px;font-weight:600">${typeLabel}</td></tr>
          <tr><td style="padding:8px 12px;color:#6b7280">Priority</td><td style="padding:8px 12px"><span style="background:${priorityColor};color:#fff;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600">${ticket.priority.toUpperCase()}</span></td></tr>
          <tr><td style="padding:8px 12px;color:#6b7280">From</td><td style="padding:8px 12px">${ticket.submitter.name}${ticket.submitter.email ? ` &lt;${ticket.submitter.email}&gt;` : ''}</td></tr>
          <tr><td style="padding:8px 12px;color:#6b7280">Page</td><td style="padding:8px 12px"><a href="${ticket.context.url}">${ticket.context.url}</a></td></tr>
          <tr><td style="padding:8px 12px;color:#6b7280">Browser</td><td style="padding:8px 12px;font-size:12px">${ticket.context.userAgent}</td></tr>
          <tr><td style="padding:8px 12px;color:#6b7280">Screen</td><td style="padding:8px 12px">${ticket.context.screen} (${ticket.context.platform})</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
        <h3 style="margin:0 0 8px;font-size:16px">${ticket.title}</h3>
        <p style="color:#374151;white-space:pre-wrap;line-height:1.6">${ticket.description}</p>
        ${imagePreviewsHtml ? `<h3 style="margin:16px 0 8px">Attachment Previews</h3>${imagePreviewsHtml}` : ''}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
        <p style="font-size:12px;color:#9ca3af">Ticket ID: ${ticket.id} | ${ticket.timestamp}</p>
      </div>
    </div>`;

  try {
    await sgMail.send({
      to,
      from,
      subject: `[${appName}] ${typeLabel}: ${ticket.title}`,
      html,
      attachments: sgAttachments,
    });
  } catch (err) {
    console.error('[FBWidget] SendGrid email failed:', err.message);
  }
}

async function createGitHubIssue(ticket) {
  const repo = process.env.FEEDBACK_GITHUB_REPO;
  const token = process.env.FEEDBACK_GITHUB_TOKEN;
  if (!repo || !token) return;

  const labelMap = { bug: 'bug', feature: 'enhancement', question: 'question', support: 'help wanted' };
  const labels = [labelMap[ticket.type] || 'feedback', `priority:${ticket.priority}`];

  const body = [
    `**Type:** ${TYPE_LABELS[ticket.type] || ticket.type}`,
    `**Priority:** ${ticket.priority}`,
    `**From:** ${ticket.submitter.name}${ticket.submitter.email ? ` (${ticket.submitter.email})` : ''}`,
    `**Page:** ${ticket.context.url}`,
    `**Browser:** ${ticket.context.userAgent}`,
    `**Screen:** ${ticket.context.screen}`,
    '', '---', '',
    ticket.description,
    '', `_Ticket ID: ${ticket.id}_`,
  ].join('\n');

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: ticket.title, body, labels }),
    });
    if (!res.ok) console.error('[FBWidget] GitHub issue failed:', res.status);
  } catch (err) {
    console.error('[FBWidget] GitHub issue error:', err.message);
  }
}

module.exports = router;
