import { useState } from 'react'
import AppShell from './AppShell'
import Sheet from './Sheet'

// Layout dipakai bersama oleh CtaLibrary, CaptionFormulaLibrary, HookLibrary —
// ketiganya polanya sama: judul + subjudul, tombol tambah, filter kategori,
// grid/list kartu yang bisa di-copy ke clipboard. Bikin satu layout di sini
// biar 3 halaman itu tidak duplikasi struktur yang sama persis.
export default function LibraryPageLayout({ title, subtitle, categories, activeCategory, onCategoryChange, addLabel, onAddClick, children }) {
  return (
    <AppShell maxWidth={820}>
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
    </AppShell>
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
//
// Wadahnya sekarang Sheet: kotak di tengah pada layar lebar, panel yang naik
// dari bawah di ponsel. Kolom-kolomnya memakai kelas bersama .input dan
// .field-label, bukan objek gaya yang di-spread seperti sebelumnya — dua
// ekspor gaya itu sudah dihapus. Selain menghilangkan duplikasi, itu juga
// yang membuat kolomnya berukuran 16 piksel di ponsel, karena di bawah angka
// itu papan ketik iOS memperbesar seluruh halaman dan tidak pernah
// mengembalikannya.
export function LibraryFormModal({ title, onClose, onSubmit, children, submitLabel = 'Simpan' }) {
  return (
    <Sheet open onClose={onClose} title={title} lebar={400}>
      <form onSubmit={onSubmit}>
        {children}
        <div className="sheet-aksi">
          <button type="button" onClick={onClose} className="btn">Batal</button>
          <button type="submit" className="btn btn-primary">{submitLabel}</button>
        </div>
      </form>
    </Sheet>
  )
}
