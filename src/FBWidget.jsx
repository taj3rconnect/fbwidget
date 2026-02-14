import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TICKET_TYPES, PRIORITIES, MOODS, FBWIDGET_VERSION, ALLOWED_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from './constants';
import { styles } from './styles';
import { initTrackers } from './trackers';
import { collectEnvInfo } from './envCollector';
import { CameraIcon, PaperclipIcon } from './icons';
import { AnnotationOverlay } from './AnnotationOverlay';

export function FBWidget({ apiUrl = '/api/feedback', userName, userEmail }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [annotating, setAnnotating] = useState(null);
  const [form, setForm] = useState({
    type: 'bug', title: '', description: '', priority: 'medium', mood: 3,
    name: userName || '', email: userEmail || '',
  });
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => { initTrackers(); }, []);

  useEffect(() => {
    if (userName) setForm((f) => ({ ...f, name: userName }));
  }, [userName]);
  useEffect(() => {
    if (userEmail) setForm((f) => ({ ...f, email: userEmail }));
  }, [userEmail]);

  const resetForm = () => {
    setForm({ type: 'bug', title: '', description: '', priority: 'medium', mood: 3,
      name: userName || '', email: userEmail || '' });
    setAttachments([]);
    setSuccess(false);
  };

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) { alert(`File "${file.name}" exceeds 10MB limit.`); return false; }
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) { alert(`File type not allowed: ${file.name}`); return false; }
    return true;
  };

  const addFiles = useCallback((files) => {
    const valid = Array.from(files).filter(validateFile);
    const newAttachments = valid.map((file) => ({
      file, id: Math.random().toString(36).slice(2),
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

  // Screenshot capture — opens annotation overlay
  const takeScreenshot = useCallback(async () => {
    try {
      let canvas;
      if (typeof window.html2canvas === 'function') {
        canvas = await window.html2canvas(document.body);
      } else {
        const { default: h2c } = await import('html2canvas');
        canvas = await h2c(document.body, {
          useCORS: true, logging: false, scale: 1,
          ignoreElements: (el) => el.closest && el.closest('[data-fbwidget]'),
        });
      }
      canvas.toBlob((blob) => {
        if (blob) setAnnotating({ blob, dataUrl: URL.createObjectURL(blob) });
      }, 'image/png');
    } catch {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: 'screen' } });
        const track = stream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(track);
        const bitmap = await imageCapture.grabFrame();
        track.stop();
        const c = document.createElement('canvas');
        c.width = bitmap.width; c.height = bitmap.height;
        c.getContext('2d').drawImage(bitmap, 0, 0);
        c.toBlob((blob) => {
          if (blob) setAnnotating({ blob, dataUrl: URL.createObjectURL(blob) });
        }, 'image/png');
      } catch {
        alert('Screenshot capture cancelled or not supported.');
      }
    }
  }, []);

  const handleAnnotationDone = (blob) => {
    const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' });
    addFiles([file]);
    if (annotating?.dataUrl) URL.revokeObjectURL(annotating.dataUrl);
    setAnnotating(null);
  };

  const handleAnnotationCancel = () => {
    if (annotating?.dataUrl) URL.revokeObjectURL(annotating.dataUrl);
    setAnnotating(null);
  };

  // Clipboard paste handler
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = [];
      for (const item of items) {
        if (item.kind === 'file') { const f = item.getAsFile(); if (f) files.push(f); }
      }
      if (files.length) { e.preventDefault(); addFiles(files); }
    };
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, [open, addFiles]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) { alert('Title and description are required.'); return; }
    setSubmitting(true);
    try {
      const envInfo = await collectEnvInfo();

      const fd = new FormData();
      fd.append('type', form.type);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('priority', form.priority);
      fd.append('mood', String(form.mood));
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('url', window.location.href);
      fd.append('timestamp', new Date().toISOString());
      fd.append('userAgent', navigator.userAgent);
      fd.append('screen', `${screen.width}x${screen.height}`);
      fd.append('platform', navigator.platform || '');
      fd.append('envInfo', JSON.stringify(envInfo));
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
    <div data-fbwidget="true">
      {!open && (
        <button style={styles.triggerBtn} onClick={() => setOpen(true)} title="Send Feedback"
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
          {'\u{1F4AC}'}
        </button>
      )}

      <div style={{ ...styles.overlay, ...(open ? styles.overlayOpen : {}) }}
        onClick={() => { setOpen(false); if (success) resetForm(); }} />

      <div style={{ ...styles.panel, ...(open ? styles.panelOpen : {}) }}>
        <div style={styles.header}>
          <h3 style={styles.headerTitle}>Send Feedback</h3>
          <button style={styles.closeBtn} onClick={() => { setOpen(false); if (success) resetForm(); }}>{'\u2715'}</button>
        </div>

        <div style={styles.body}>
          {success ? (
            <div style={styles.successMsg}>
              <span style={{ fontSize: '48px' }}>{'\u2705'}</span>
              <h3 style={{ margin: 0, color: '#1f2937' }}>Thank you!</h3>
              <p style={{ color: '#6b7280', margin: 0 }}>Your feedback has been submitted successfully.</p>
              <button style={styles.submitBtn} onClick={resetForm}>Submit Another</button>
            </div>
          ) : (
            <>
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

              <div>
                <label style={styles.label}>Title</label>
                <input style={styles.input} placeholder="Brief summary" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>

              <div>
                <label style={styles.label}>Description</label>
                <textarea style={styles.textarea} placeholder="Describe in detail..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

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

              <div>
                <label style={styles.label}>How are you feeling?</label>
                <div style={styles.moodRow}>
                  {MOODS.map((m) => (
                    <button key={m.value} style={styles.moodBtn(form.mood === m.value)}
                      onClick={() => setForm((f) => ({ ...f, mood: m.value }))}
                      title={m.label}>
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={styles.label}>Attachments</label>
                <div style={styles.attachRow}>
                  <button style={styles.iconBtn} onClick={takeScreenshot} title="Take Screenshot"
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}>
                    <CameraIcon />
                  </button>
                  <button style={styles.iconBtn} onClick={() => fileInputRef.current?.click()} title="Attach File"
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}>
                    <PaperclipIcon />
                  </button>
                  <div style={{ ...styles.attachZone, ...(dragging ? styles.attachZoneDrag : {}) }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
                    Drop files or paste from clipboard
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
                        <button style={styles.thumbRemove} onClick={() => removeAttachment(a.id)}>{'\u2715'}</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button style={{ ...styles.submitBtn, ...(submitting ? styles.submitBtnDisabled : {}) }}
                disabled={submitting} onClick={handleSubmit}>
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>

              <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
                Auto-captures: performance, errors, navigation, browser info
              </div>
            </>
          )}
          <div style={{ fontSize: '10px', color: '#1f2937', fontWeight: 600, textAlign: 'right', marginTop: 'auto', paddingTop: '8px' }}>
            {FBWIDGET_VERSION}
          </div>
        </div>
      </div>

      {annotating && (
        <AnnotationOverlay
          imageDataUrl={annotating.dataUrl}
          onDone={handleAnnotationDone}
          onCancel={handleAnnotationCancel}
        />
      )}
    </div>
  );
}
