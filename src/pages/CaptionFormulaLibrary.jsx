// TODO(supabase): needs a dedicated table — not part of Fase 1 schema yet
import { useState } from 'react'
import LibraryPageLayout, { LibraryFormModal } from '../components/LibraryPageLayout'
import { CAPTION_FORMULAS } from '../data/mockLibraries'

export default function CaptionFormulaLibrary() {
  const [items, setItems] = useState(CAPTION_FORMULAS)
  const [goal, setGoal] = useState('Semua')
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [newGoal, setNewGoal] = useState('')
  const [structure, setStructure] = useState('')

  const goals = ['Semua', ...new Set(items.map((c) => c.goal))]
  const filtered = goal === 'Semua' ? items : items.filter((c) => c.goal === goal)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !structure.trim()) return
    setItems((prev) => [{ id: Date.now(), name: name.trim(), goal: newGoal.trim() || 'Umum', structure: structure.trim() }, ...prev])
    setName(''); setNewGoal(''); setStructure('')
    setShowModal(false)
  }

  return (
    <LibraryPageLayout
      title="Caption formula library"
      subtitle="Rumus caption per tujuan konten, tinggal isi sesuai kebutuhan"
      categories={goals}
      activeCategory={goal}
      onCategoryChange={setGoal}
      addLabel="+ Formula baru"
      onAddClick={() => setShowModal(true)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((f) => (
          <div key={f.id} style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>{f.name}</p>
              <span style={{ fontSize: 10.5, color: 'var(--accent)', background: 'var(--accent-bg)', padding: '2px 7px', borderRadius: 5 }}>{f.goal}</span>
            </div>
            <p style={{ fontSize: 12.5, margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.structure}</p>
          </div>
        ))}
      </div>

      {showModal && (
        <LibraryFormModal title="Caption formula baru" onClose={() => setShowModal(false)} onSubmit={handleSubmit} submitLabel="Tambah formula">
          <label className="field-label">Nama formula</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Story-based hook" className="input" style={{ marginBottom: 12 }} />
          <label className="field-label">Tujuan</label>
          <input value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="Contoh: Edukasi, Campaign" className="input" style={{ marginBottom: 12 }} />
          <label className="field-label">Struktur</label>
          <textarea value={structure} onChange={(e) => setStructure(e.target.value)} placeholder="Jelaskan urutan/struktur captionnya" rows={3} className="textarea" style={{ resize: 'vertical' }} />
        </LibraryFormModal>
      )}
    </LibraryPageLayout>
  )
}
