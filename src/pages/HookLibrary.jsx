// TODO(supabase): needs a dedicated table — not part of Fase 1 schema yet
import { useState } from 'react'
import LibraryPageLayout, { useCopyFeedback, LibraryFormModal } from '../components/LibraryPageLayout'
import { HOOK_LIBRARY } from '../data/mockLibraries'

export default function HookLibrary() {
  const [items, setItems] = useState(HOOK_LIBRARY)
  const [category, setCategory] = useState('Semua')
  const [showModal, setShowModal] = useState(false)
  const [text, setText] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const { copiedId, copy } = useCopyFeedback()

  const categories = ['Semua', ...new Set(items.map((h) => h.category))]
  const filtered = category === 'Semua' ? items : items.filter((h) => h.category === category)

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setItems((prev) => [{ id: Date.now(), text: text.trim(), category: newCategory.trim() || 'Umum' }, ...prev])
    setText(''); setNewCategory('')
    setShowModal(false)
  }

  return (
    <LibraryPageLayout
      title="Hook library"
      subtitle="Template kalimat pembuka, tinggal ganti bagian dalam kurung"
      categories={categories}
      activeCategory={category}
      onCategoryChange={setCategory}
      addLabel="+ Hook baru"
      onAddClick={() => setShowModal(true)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((h) => (
          <div key={h.id} style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p style={{ fontSize: 13, margin: '0 0 3px', color: 'var(--text-primary)' }}>{h.text}</p>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{h.category}</span>
            </div>
            <button
              onClick={() => copy(h.id, h.text)}
              style={{ fontSize: 11.5, padding: '5px 10px', borderRadius: 7, border: '0.5px solid var(--border)', background: '#fff', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 }}
            >
              {copiedId === h.id ? 'Tersalin ✓' : 'Salin'}
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <LibraryFormModal title="Hook baru" onClose={() => setShowModal(false)} onSubmit={handleSubmit} submitLabel="Tambah hook">
          <label className="field-label">Teks hook</label>
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Contoh: Kamu tau nggak kalau [fakta]?" className="input" style={{ marginBottom: 12 }} />
          <label className="field-label">Kategori</label>
          <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Contoh: Edukasi, Testimoni" className="input" />
        </LibraryFormModal>
      )}
    </LibraryPageLayout>
  )
}
