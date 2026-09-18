// TODO(supabase): needs a dedicated table — not part of Fase 1 schema yet
import { useState } from 'react'
import LibraryPageLayout, { useCopyFeedback, LibraryFormModal } from '../components/LibraryPageLayout'
import { CTA_LIBRARY } from '../data/mockLibraries'

export default function CtaLibrary() {
  const [items, setItems] = useState(CTA_LIBRARY)
  const [goal, setGoal] = useState('Semua')
  const [showModal, setShowModal] = useState(false)
  const [text, setText] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const { copiedId, copy } = useCopyFeedback()

  const goals = ['Semua', ...new Set(items.map((c) => c.goal))]
  const filtered = goal === 'Semua' ? items : items.filter((c) => c.goal === goal)

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() || !newGoal.trim()) return
    setItems((prev) => [{ id: Date.now(), text: text.trim(), goal: newGoal.trim() }, ...prev])
    setText('')
    setNewGoal('')
    setShowModal(false)
    // TODO Fase 2 lanjutan: insert ke tabel cta_library kalau modul ini
    // dipisah jadi tabelnya sendiri di Supabase (belum ada di fase1_skema_supabase.sql
    // karena awalnya cuma dianggap referensi statis — perlu ditambah kalau jadi editable beneran).
  }

  return (
    <LibraryPageLayout
      title="CTA library"
      subtitle="Kumpulan call-to-action siap pakai, dikelompokkan per tujuan konten"
      categories={goals}
      activeCategory={goal}
      onCategoryChange={setGoal}
      addLabel="+ CTA baru"
      onAddClick={() => setShowModal(true)}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
        {filtered.map((c) => (
          <div key={c.id} style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 14 }}>
            <span style={{ fontSize: 10.5, color: 'var(--accent)', background: 'var(--accent-bg)', padding: '2px 7px', borderRadius: 5 }}>{c.goal}</span>
            <p style={{ fontSize: 13, margin: '8px 0 10px', color: 'var(--text-primary)' }}>{c.text}</p>
            <button
              onClick={() => copy(c.id, c.text)}
              style={{ fontSize: 11.5, padding: '5px 10px', borderRadius: 7, border: '0.5px solid var(--border)', background: '#fff', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              {copiedId === c.id ? 'Tersalin ✓' : 'Salin'}
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <LibraryFormModal title="CTA baru" onClose={() => setShowModal(false)} onSubmit={handleSubmit} submitLabel="Tambah CTA">
          <label className="field-label">Teks CTA</label>
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Contoh: Klik link di bio buat donasi" className="input" style={{ marginBottom: 12 }} />
          <label className="field-label">Tujuan</label>
          <input value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="Contoh: Donasi, Follow, Share" className="input" />
        </LibraryFormModal>
      )}
    </LibraryPageLayout>
  )
}
