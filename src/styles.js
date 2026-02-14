export const styles = {
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
    position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px', maxWidth: '100vw',
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
  body: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' },
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
    fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '220px',
    boxSizing: 'border-box', fontFamily: 'inherit',
  },
  priorityRow: { display: 'flex', gap: '8px' },
  priorityBtn: (selected, color) => ({
    flex: 1, padding: '8px', borderRadius: '8px', border: `2px solid ${selected ? color : '#e5e7eb'}`,
    background: selected ? `${color}15` : '#fff', cursor: 'pointer', fontSize: '13px',
    fontWeight: selected ? 600 : 400, color: '#1f2937', textAlign: 'center',
  }),
  moodRow: { display: 'flex', gap: '6px', justifyContent: 'center' },
  moodBtn: (selected) => ({
    padding: '8px 10px', borderRadius: '8px', border: `2px solid ${selected ? '#2563eb' : '#e5e7eb'}`,
    background: selected ? '#eff6ff' : '#fff', cursor: 'pointer', fontSize: '22px',
    transition: 'all 0.15s', textAlign: 'center',
  }),
  attachRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  iconBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #d1d5db',
    background: '#fff', cursor: 'pointer', color: '#6b7280', transition: 'all 0.15s',
  },
  attachZone: {
    flex: 1, border: '2px dashed #d1d5db', borderRadius: '8px', padding: '12px', textAlign: 'center',
    cursor: 'pointer', color: '#6b7280', fontSize: '12px', transition: 'border-color 0.15s',
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
  annotateOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10002,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  },
  annotateCanvas: {
    border: '2px solid #fff', borderRadius: '8px', cursor: 'crosshair', maxWidth: '90vw', maxHeight: '70vh',
  },
  annotateBar: { display: 'flex', gap: '12px', marginTop: '12px' },
  annotateBtn: {
    padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontSize: '14px', fontWeight: 600,
  },
};
