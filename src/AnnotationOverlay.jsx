import React, { useRef, useEffect } from 'react';
import { styles } from './styles';

export function AnnotationOverlay({ imageDataUrl, onDone, onCancel }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const maxW = window.innerWidth * 0.85;
      const maxH = window.innerHeight * 0.65;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageDataUrl;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onDown = (e) => { drawing.current = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); };
    const onMove = (e) => {
      if (!drawing.current) return;
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke();
    };
    const onUp = () => { drawing.current = false; };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onUp);
    return () => {
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mouseleave', onUp);
    };
  }, [imageDataUrl]);

  const handleDone = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) onDone(blob);
    }, 'image/png');
  };

  return (
    <div style={styles.annotateOverlay}>
      <p style={{ color: '#fff', margin: '0 0 8px', fontSize: '14px' }}>Draw on the screenshot to highlight issues</p>
      <canvas ref={canvasRef} style={styles.annotateCanvas} />
      <div style={styles.annotateBar}>
        <button style={{ ...styles.annotateBtn, background: '#22c55e', color: '#fff' }} onClick={handleDone}>Done</button>
        <button style={{ ...styles.annotateBtn, background: '#6b7280', color: '#fff' }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
