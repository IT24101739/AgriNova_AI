/**
 * ImageUploader — drag-and-drop + click + mobile camera capture.
 * Shows preview with remove button.
 * Validates file type and size (max 5MB client-side).
 */

import React, { useCallback, useRef, useState } from 'react';

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImageUploader({ file, onFileChange, error }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [localError, setLocalError] = useState('');

  const handleFile = useCallback(
    (selected) => {
      setLocalError('');
      if (!selected) return;

      if (!ACCEPTED_TYPES.includes(selected.type)) {
        setLocalError('Only JPEG, PNG, and WebP images are accepted.');
        return;
      }
      if (selected.size > MAX_SIZE_BYTES) {
        setLocalError(`Image must be smaller than ${MAX_SIZE_MB} MB.`);
        return;
      }

      // Generate preview
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
      onFileChange(selected);
    },
    [onFileChange]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files?.[0];
      handleFile(dropped);
    },
    [handleFile]
  );

  const handleRemove = () => {
    setPreviewUrl(null);
    setLocalError('');
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const displayError = localError || error;

  return (
    <div className="form-group">
      <label className="form-label">Leaf / Crop Image *</label>

      {previewUrl ? (
        /* Preview state */
        <div
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '2px solid var(--color-leaf-600)',
            boxShadow: '0 0 20px rgba(34,197,94,0.2)',
          }}
        >
          <img
            src={previewUrl}
            alt="Selected leaf"
            style={{
              width: '100%',
              height: '220px',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          {/* Overlay toolbar */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              padding: '2rem 1rem 0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
              ✅ {file?.name?.substring(0, 28)}
            </span>
            <button
              type="button"
              onClick={handleRemove}
              style={{
                background: 'rgba(239,68,68,0.8)',
                border: 'none',
                color: '#fff',
                borderRadius: '6px',
                padding: '0.3rem 0.7rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload leaf image"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragging ? '#22c55e' : displayError ? '#ef4444' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '2.5rem 1rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'rgba(34,197,94,0.06)' : 'var(--color-surface-2)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            {dragging ? '📂' : '🌿'}
          </div>
          <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
            {dragging ? 'Drop image here' : 'Upload leaf photo'}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
            Drag & drop, click to browse, or use camera
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--color-muted)',
                background: 'var(--color-surface)',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
              }}
            >
              JPEG / PNG / WebP
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--color-muted)',
                background: 'var(--color-surface)',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
              }}
            >
              Max {MAX_SIZE_MB} MB
            </span>
          </div>
        </div>
      )}

      {/* Hidden input — capture="environment" enables rear camera on mobile */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
        aria-hidden="true"
      />

      {displayError && <p className="form-error">⚠ {displayError}</p>}
    </div>
  );
}
