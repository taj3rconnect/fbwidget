<template>
  <div>
    <!-- Trigger Button -->
    <button v-if="!open" class="fbw-trigger" @click="open = true" title="Send Feedback">💬</button>

    <!-- Overlay -->
    <div class="fbw-overlay" :class="{ 'fbw-overlay--open': open }" @click="closePanel" />

    <!-- Panel -->
    <div class="fbw-panel" :class="{ 'fbw-panel--open': open }">
      <div class="fbw-header">
        <h3 class="fbw-header__title">Send Feedback</h3>
        <button class="fbw-header__close" @click="closePanel">✕</button>
      </div>

      <div class="fbw-body">
        <!-- Success -->
        <div v-if="success" class="fbw-success">
          <span style="font-size: 48px">✅</span>
          <h3>Thank you!</h3>
          <p>Your feedback has been submitted successfully.</p>
          <button class="fbw-submit" @click="resetForm">Submit Another</button>
        </div>

        <template v-else>
          <!-- Type -->
          <div>
            <label class="fbw-label">Type</label>
            <div class="fbw-type-grid">
              <button v-for="t in ticketTypes" :key="t.value"
                class="fbw-type-btn" :class="{ 'fbw-type-btn--selected': form.type === t.value }"
                @click="form.type = t.value">
                {{ t.icon }} {{ t.label }}
              </button>
            </div>
          </div>

          <!-- Name / Email -->
          <div class="fbw-row">
            <div>
              <label class="fbw-label">Name</label>
              <input class="fbw-input" placeholder="Your name" v-model="form.name" />
            </div>
            <div>
              <label class="fbw-label">Email</label>
              <input class="fbw-input" type="email" placeholder="you@example.com" v-model="form.email" />
            </div>
          </div>

          <!-- Title -->
          <div>
            <label class="fbw-label">Title</label>
            <input class="fbw-input" placeholder="Brief summary" v-model="form.title" />
          </div>

          <!-- Description -->
          <div>
            <label class="fbw-label">Description</label>
            <textarea class="fbw-textarea" placeholder="Describe in detail..." v-model="form.description" />
          </div>

          <!-- Priority -->
          <div>
            <label class="fbw-label">Priority</label>
            <div class="fbw-priority-row">
              <button v-for="p in priorities" :key="p.value"
                class="fbw-priority-btn" :class="[`fbw-priority-btn--${p.value}`, { 'fbw-priority-btn--selected': form.priority === p.value }]"
                @click="form.priority = p.value">
                {{ p.label }}
              </button>
            </div>
          </div>

          <!-- Attachments -->
          <div>
            <label class="fbw-label">Attachments</label>
            <div class="fbw-drop" :class="{ 'fbw-drop--active': dragging }"
              @click="$refs.fileInput.click()"
              @dragover.prevent="dragging = true" @dragleave="dragging = false" @drop.prevent="onDrop">
              <div>📎 Drop files here, paste from clipboard, or click to browse</div>
              <div style="font-size: 11px; margin-top: 4px; color: #9ca3af">
                PNG, JPG, GIF, PDF, TXT, LOG — max 10MB each
              </div>
            </div>
            <input ref="fileInput" type="file" multiple hidden
              accept=".png,.jpg,.jpeg,.gif,.pdf,.txt,.log" @change="onFileSelect" />
            <div v-if="attachments.length" class="fbw-thumbs">
              <div v-for="a in attachments" :key="a.id" class="fbw-thumb">
                <img v-if="a.preview" :src="a.preview" class="fbw-thumb__img" />
                <div v-else class="fbw-thumb__file">{{ a.file.name }}</div>
                <button class="fbw-thumb__remove" @click="removeAttachment(a.id)">✕</button>
              </div>
            </div>
          </div>

          <!-- Submit -->
          <button class="fbw-submit" :disabled="submitting" @click="handleSubmit">
            {{ submitting ? 'Submitting...' : 'Submit Feedback' }}
          </button>
          <div style="font-size: 11px; color: #9ca3af; text-align: center">
            Auto-captures: page URL, browser info, screen size, timestamp
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'application/pdf', 'text/plain'];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.txt', '.log'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default {
  name: 'FBWidget',
  props: {
    apiUrl: { type: String, default: '/api/feedback' },
  },
  data() {
    return {
      open: false,
      submitting: false,
      success: false,
      dragging: false,
      form: { type: 'bug', title: '', description: '', priority: 'medium', name: '', email: '' },
      attachments: [],
      ticketTypes: [
        { value: 'bug', label: 'Bug Report', icon: '🐛' },
        { value: 'feature', label: 'Feature Request', icon: '✨' },
        { value: 'question', label: 'Question', icon: '❓' },
        { value: 'support', label: 'Support Ticket', icon: '🎫' },
      ],
      priorities: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
    };
  },
  mounted() {
    document.addEventListener('paste', this.onPaste);
  },
  beforeUnmount() {
    document.removeEventListener('paste', this.onPaste);
  },
  methods: {
    closePanel() {
      this.open = false;
      if (this.success) this.resetForm();
    },
    resetForm() {
      this.form = { type: 'bug', title: '', description: '', priority: 'medium', name: '', email: '' };
      this.attachments.forEach((a) => { if (a.preview) URL.revokeObjectURL(a.preview); });
      this.attachments = [];
      this.success = false;
    },
    validateFile(file) {
      if (file.size > MAX_FILE_SIZE) { alert(`File "${file.name}" exceeds 10MB limit.`); return false; }
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
        alert(`File type not allowed: ${file.name}`); return false;
      }
      return true;
    },
    addFiles(files) {
      Array.from(files).filter((f) => this.validateFile(f)).forEach((file) => {
        this.attachments.push({
          file, id: Math.random().toString(36).slice(2),
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        });
      });
    },
    removeAttachment(id) {
      const idx = this.attachments.findIndex((a) => a.id === id);
      if (idx !== -1) {
        if (this.attachments[idx].preview) URL.revokeObjectURL(this.attachments[idx].preview);
        this.attachments.splice(idx, 1);
      }
    },
    onPaste(e) {
      if (!this.open) return;
      const files = [];
      for (const item of (e.clipboardData?.items || [])) {
        if (item.kind === 'file') { const f = item.getAsFile(); if (f) files.push(f); }
      }
      if (files.length) { e.preventDefault(); this.addFiles(files); }
    },
    onDrop(e) { this.dragging = false; this.addFiles(e.dataTransfer.files); },
    onFileSelect(e) { this.addFiles(e.target.files); e.target.value = ''; },
    async handleSubmit() {
      if (!this.form.title.trim() || !this.form.description.trim()) {
        alert('Title and description are required.'); return;
      }
      this.submitting = true;
      try {
        const fd = new FormData();
        fd.append('type', this.form.type);
        fd.append('title', this.form.title);
        fd.append('description', this.form.description);
        fd.append('priority', this.form.priority);
        fd.append('name', this.form.name);
        fd.append('email', this.form.email);
        fd.append('url', window.location.href);
        fd.append('timestamp', new Date().toISOString());
        fd.append('userAgent', navigator.userAgent);
        fd.append('screen', `${screen.width}x${screen.height}`);
        fd.append('platform', navigator.platform || '');
        this.attachments.forEach((a) => fd.append('attachments', a.file));
        const res = await fetch(this.apiUrl, { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Failed');
        this.success = true;
      } catch (err) {
        alert('Failed to submit feedback.'); console.error(err);
      } finally { this.submitting = false; }
    },
  },
};
</script>

<style scoped>
.fbw-trigger {
  position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px;
  border-radius: 50%; background: #2563eb; color: #fff; border: none;
  cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.4); z-index: 9999;
  display: flex; align-items: center; justify-content: center; font-size: 24px;
  transition: transform 0.2s;
}
.fbw-trigger:hover { transform: scale(1.1); }
.fbw-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 10000;
  opacity: 0; transition: opacity 0.3s; pointer-events: none;
}
.fbw-overlay--open { opacity: 1; pointer-events: auto; }
.fbw-panel {
  position: fixed; top: 0; right: 0; bottom: 0; width: 420px; max-width: 100vw;
  background: #fff; z-index: 10001; box-shadow: -4px 0 24px rgba(0,0,0,0.15);
  display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.3s ease;
}
.fbw-panel--open { transform: translateX(0); }
.fbw-header {
  padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex;
  align-items: center; justify-content: space-between; background: #2563eb; color: #fff;
}
.fbw-header__title { margin: 0; font-size: 16px; font-weight: 600; }
.fbw-header__close { background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; }
.fbw-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.fbw-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.fbw-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.fbw-type-btn {
  padding: 10px 12px; border-radius: 8px; border: 2px solid #e5e7eb; background: #fff;
  cursor: pointer; text-align: left; font-size: 13px; color: #1f2937; transition: all 0.15s;
}
.fbw-type-btn--selected { border-color: #2563eb; background: #eff6ff; font-weight: 600; }
.fbw-input {
  width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #d1d5db;
  font-size: 14px; outline: none; box-sizing: border-box;
}
.fbw-textarea {
  width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #d1d5db;
  font-size: 14px; outline: none; resize: vertical; min-height: 80px;
  box-sizing: border-box; font-family: inherit;
}
.fbw-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.fbw-priority-row { display: flex; gap: 8px; }
.fbw-priority-btn {
  flex: 1; padding: 8px; border-radius: 8px; border: 2px solid #e5e7eb; background: #fff;
  cursor: pointer; font-size: 13px; color: #1f2937; text-align: center;
}
.fbw-priority-btn--selected.fbw-priority-btn--low { border-color: #22c55e; background: rgba(34,197,94,0.08); font-weight: 600; }
.fbw-priority-btn--selected.fbw-priority-btn--medium { border-color: #f59e0b; background: rgba(245,158,11,0.08); font-weight: 600; }
.fbw-priority-btn--selected.fbw-priority-btn--high { border-color: #ef4444; background: rgba(239,68,68,0.08); font-weight: 600; }
.fbw-drop {
  border: 2px dashed #d1d5db; border-radius: 8px; padding: 16px; text-align: center;
  cursor: pointer; color: #6b7280; font-size: 13px;
}
.fbw-drop--active { border-color: #2563eb; background: #eff6ff; }
.fbw-thumbs { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.fbw-thumb {
  position: relative; width: 64px; height: 64px; border-radius: 6px;
  overflow: hidden; border: 1px solid #e5e7eb;
}
.fbw-thumb__img { width: 100%; height: 100%; object-fit: cover; }
.fbw-thumb__file {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: #f3f4f6; font-size: 10px; color: #6b7280; padding: 4px; text-align: center;
  word-break: break-all;
}
.fbw-thumb__remove {
  position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; border-radius: 50%;
  background: rgba(0,0,0,0.6); color: #fff; border: none; cursor: pointer; font-size: 11px;
  display: flex; align-items: center; justify-content: center;
}
.fbw-submit {
  padding: 12px; border-radius: 8px; background: #2563eb; color: #fff; border: none;
  cursor: pointer; font-size: 15px; font-weight: 600; transition: background 0.15s; width: 100%;
}
.fbw-submit:disabled { background: #93c5fd; cursor: not-allowed; }
.fbw-success { text-align: center; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.fbw-success h3 { margin: 0; color: #1f2937; }
.fbw-success p { color: #6b7280; margin: 0; }
</style>
