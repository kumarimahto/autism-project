import React from 'react'

export default function Modal({ open, title, message, onClose, primaryLabel = 'OK', primaryAction, secondaryLabel, secondaryAction }) {
  if (!open) return null
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
          {secondaryLabel && typeof secondaryAction === 'function' && (
            <button className="btn-close" onClick={() => { secondaryAction(); }} style={{ background: '#fff', color: '#0b1220', border: '1px solid #e2e8f0' }}>{secondaryLabel}</button>
          )}
          <button className="btn-close" onClick={() => { if (primaryAction) primaryAction(); if (onClose) onClose(); }}>{primaryLabel}</button>
        </div>
      </div>
    </div>
  )
}
