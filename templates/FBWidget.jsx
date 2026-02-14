import React, { useState, useRef, useCallback, useEffect } from 'react';

const TICKET_TYPES = [
  { value: 'bug', label: 'Bug Report', icon: '🐛' },
  { value: 'feature', label: 'Feature Request', icon: '✨' },
  { value: 'question', label: 'Question', icon: '❓' },
  { value: 'support', label: 'Support Ticket', icon: '🎫' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#22c55e' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
];

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'application/pdf', 'text/plain'];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.txt', '.log'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const styles = {
  triggerBtn: {
    position: 'fixed', bottom: '24px', right: '24px', width: '56px', height: '56px',
    borderRadius: '50%', background: '#2563eb', color: '#fff', border: 'none',
    cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.4)', zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 10000,
    opacity: 0, transition: 'opacity 0.3s', pointerEvents: 'none',
  },
  overlayOpen: { opacity: 1, pointerEvents: 'auto' },
  panel: {
    position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px', maxWidth: '100vw',
    background: '#fff', zIndex: 10001, boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
    display: 'flex', flexDirection: 'column', transform: 'translateX(100%)',
    transition: 'transform 0.3s ease',
  },
  panelOpen: { transform: 'translateX(0)' },
  header: {
    padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between', background: '#2563eb', color: '#fff',
  },
  headerTitle: { margin: 0, fontSize: '16px', fontWeight: 600 },
  closeBtn: {
    background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer',
    padding: '4px 8px', borderRadius: '4px',
  },
  body: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' },
  typeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  typeBtn: (selected) => ({
    padding: '10px 12px', borderRadius: '8px', border: `2px solid ${selected ? '#2563eb' : '#e5e7eb'}`,
    background: selected ? '#eff6ff' : '#fff', cursor: 'pointer', textAlign: 'left',
    fontSize: '13px', fontWeight: selected ? 600 : 400, color: '#1f2937', transition: 'all 0.15s',
  }),
  input: {
    width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
  },
  textarea: {
    width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
    fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '80px',
    boxSizing: 'border-box', fontFamily: 'inherit',
  },
  priorityRow: { display: 'flex', gap: '8px' },
  priorityBtn: (selected, color) => ({
    flex: 1, padding: '8px', borderRadius: '8px', border: `2px solid ${selected ? color : '#e5e7eb'}`,
    background: selected ? `${color}15` : '#fff', cursor: 'pointer', fontSize: '13px',
    fontWeight: selected ? 600 : 400, color: '#1f2937', textAlign: 'center',
  }),
  attachZone: {
    border: '2px dashed #d1d5db', borderRadius: '8px', padding: '16px', textAlign: 'center',
    cursor: 'pointer', color: '#6b7280', fontSize: '13px', transition: 'border-color 0.15s',
  },
  attachZoneDrag: { borderColor: '#2563eb', background: '#eff6ff' },
  thumbRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' },
  thumb: {
    position: 'relative', width: '64px', height: '64px', borderRadius: '6px', overflow: 'hidden',
    border: '1px solid #e5e7eb',
  },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbFile: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f3f4f6', fontSize: '10px', color: '#6b7280', padding: '4px', textAlign: 'center',
    wordBreak: 'break-all',
  },
  thumbRemove: {
    position: 'absolute', top: '2px', right: '2px', width: '18px', height: '18px', borderRadius: '50%',
    background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
  },
  submitBtn: {
    padding: '12px', borderRadius: '8px', background: '#2563eb', color: '#fff', border: 'none',
    cursor: 'pointer', fontSize: '15px', fontWeight: 600, marginTop: '4px',
    transition: 'background 0.15s',
  },
  submitBtnDisabled: { background: '#93c5fd', cursor: 'not-allowed' },
  successMsg: {
    textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '12px',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
};

export default function FBWidget({ apiUrl = '/api/feedback' }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState({
    type: 'bug', title: '', description: '', priority: 'medium', name: '', email: '',
  });
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const resetForm = () => {
    setForm({ type: 'bug', title: '', description: '', priority: 'medium', name: '', email: '' });
    setAttachments([]);
    setSuccess(false);
  };

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      alert(`File "${file.name}" exceeds 10MB limit.`);
      return false;
    }
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      alert(`File type not allowed: ${file.name}`);
      return false;
    }
    return true;
  };

  const addFiles = useCallback((files) => {
    const valid = Array.from(files).filter(validateFile);
    const newAttachments = valid.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const removeAttachment = (id) => {
    setAttachments((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((a) => a.id !== id);
    });
  };

  // Clipboard paste
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = [];
      for (const item of items) {
        if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) {
        e.preventDefault();
        addFiles(files);
      }
    };
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, [open, addFiles]);

  // Drag and drop
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      alert('Title and description are required.');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('type', form.type);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('priority', form.priority);
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('url', window.location.href);
      fd.append('timestamp', new Date().toISOString());
      fd.append('userAgent', navigator.userAgent);
      fd.append('screen', `${screen.width}x${screen.height}`);
      fd.append('platform', navigator.platform || '');
      attachments.forEach((a) => fd.append('attachments', a.file));

      const res = await fetch(apiUrl, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Submission failed');
      setSuccess(true);
    } catch (err) {
      alert('Failed to submit feedback. Please try again.');
      console.error('FBWidget submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      {!open && (
        <button style={styles.triggerBtn} onClick={() => setOpen(true)} title="Send Feedback"
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
          💬
        </button>
      )}

      {/* Overlay */}
      <div style={{ ...styles.overlay, ...(open ? styles.overlayOpen : {}) }}
        onClick={() => { setOpen(false); if (success) resetForm(); }} />

      {/* Panel */}
      <div style={{ ...styles.panel, ...(open ? styles.panelOpen : {}) }}>
        <div style={styles.header}>
          <h3 style={styles.headerTitle}>Send Feedback</h3>
          <button style={styles.closeBtn} onClick={() => { setOpen(false); if (success) resetForm(); }}>✕</button>
        </div>

        <div style={styles.body}>
          {success ? (
            <div style={styles.successMsg}>
              <span style={{ fontSize: '48px' }}>✅</span>
              <h3 style={{ margin: 0, color: '#1f2937' }}>Thank you!</h3>
              <p style={{ color: '#6b7280', margin: 0 }}>Your feedback has been submitted successfully.</p>
              <button style={styles.submitBtn} onClick={resetForm}>Submit Another</button>
            </div>
          ) : (
            <>
              {/* Type */}
              <div>
                <label style={styles.label}>Type</label>
                <div style={styles.typeGrid}>
                  {TICKET_TYPES.map((t) => (
                    <button key={t.value} style={styles.typeBtn(form.type === t.value)}
                      onClick={() => setForm((f) => ({ ...f, type: t.value }))}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name / Email */}
              <div style={styles.row}>
                <div>
                  <label style={styles.label}>Name</label>
                  <input style={styles.input} placeholder="Your name" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label style={styles.label}>Email</label>
                  <input style={styles.input} type="email" placeholder="you@example.com" value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={styles.label}>Title</label>
                <input style={styles.input} placeholder="Brief summary" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>

              {/* Description */}
              <div>
                <label style={styles.label}>Description</label>
                <textarea style={styles.textarea} placeholder="Describe in detail..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              {/* Priority */}
              <div>
                <label style={styles.label}>Priority</label>
                <div style={styles.priorityRow}>
                  {PRIORITIES.map((p) => (
                    <button key={p.value} style={styles.priorityBtn(form.priority === p.value, p.color)}
                      onClick={() => setForm((f) => ({ ...f, priority: p.value }))}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label style={styles.label}>Attachments</label>
                <div ref={dropRef}
                  style={{ ...styles.attachZone, ...(dragging ? styles.attachZoneDrag : {}) }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
                  <div>📎 Drop files here, paste from clipboard, or click to browse</div>
                  <div style={{ fontSize: '11px', marginTop: '4px', color: '#9ca3af' }}>
                    PNG, JPG, GIF, PDF, TXT, LOG — max 10MB each
                  </div>
                </div>
                <input ref={fileInputRef} type="file" multiple hidden
                  accept=".png,.jpg,.jpeg,.gif,.pdf,.txt,.log"
                  onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />

                {attachments.length > 0 && (
                  <div style={styles.thumbRow}>
                    {attachments.map((a) => (
                      <div key={a.id} style={styles.thumb}>
                        {a.preview ? (
                          <img src={a.preview} alt={a.file.name} style={styles.thumbImg} />
                        ) : (
                          <div style={styles.thumbFile}>{a.file.name}</div>
                        )}
                        <button style={styles.thumbRemove} onClick={() => removeAttachment(a.id)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                style={{ ...styles.submitBtn, ...(submitting ? styles.submitBtnDisabled : {}) }}
                disabled={submitting} onClick={handleSubmit}>
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>

              <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
                Auto-captures: page URL, browser info, screen size, timestamp
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
