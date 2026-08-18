import { useState } from 'react'
import Sidebar from './Sidebar'

// Layout dipakai bersama oleh CtaLibrary, CaptionFormulaLibrary, HookLibrary —
// ketiganya polanya sama: judul + subjudul, tombol tambah, filter kategori,
// grid/list kartu yang bisa di-copy ke clipboard. Bikin satu layout di sini
// biar 3 halaman itu tidak duplikasi struktur yang sama persis.
export default function LibraryPageLayout({ title, subtitle, categories, activeCategory, onCategoryChange, addLabel, onAddClick, children }) {
  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: 16, display: 'grid', gridTemplateColumns: '190px 1fr', gap: 16 }}>
      <Sidebar />
      <div style={{ maxWidth: 760 }}>
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>{title}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{subtitle}</p>
          </div>
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="hero-btn filled"
              style={{ color: 'var(--accent)', border: '0.5px solid var(--border)', background: 'var(--accent-bg)' }}
            >
              {addLabel || '+ Tambah'}
            </button>
          )}
        </div>

        {categories && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => onCategoryChange(c)}
                style={{
                  fontSize: 12, padding: '5px 10px', borderRadius: 7, cursor: 'pointer',
                  border: '0.5px solid var(--border)',
                  background: activeCategory === c ? 'var(--accent)' : '#fff',
                  color: activeCategory === c ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  )
}

export function useCopyFeedback() {
  const [copiedId, setCopiedId] = useState(null)
  function copy(id, text) {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500)
  }
  return { copiedId, copy }
}

// Modal generik dipakai ketiga library page — bedanya cuma field yang
// dirender lewat children (form fields), submit tetap konsisten.
export function LibraryFormModal({ title, onClose, onSubmit, children, submitLabel = 'Simpan' }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26,26,46,0.35)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }} onClick={onClose}>
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 14, padding: 20, width: 380 }}
      >
        <p style={{ fontWeight: 500, fontSize: 14, margin: '0 0 14px' }}>{title}</p>
        {children}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button type="button" onClick={onClose} style={{ fontSize: 12.5, padding: '7px 12px', borderRadius: 8, border: '0.5px solid var(--border)', background: '#fff', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            Batal
          </button>
          <button type="submit" style={{ fontSize: 12.5, padding: '7px 12px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

export const formFieldStyle = { width: '100%', border: '0.5px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, marginBottom: 12, boxSizing: 'border-box' }
export const formLabelStyle = { fontSize: 11.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }
