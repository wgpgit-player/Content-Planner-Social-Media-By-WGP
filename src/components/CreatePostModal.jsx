import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sheet from './Sheet'
import Icon from './Icon'
import { PLATFORMS } from '../config/platforms'

// Pop-in "pilih platform dulu" ala Plann — dipanggil dari tombol "Buat
// konten" di Sidebar (dan dari kartu Home). Cuma satu keputusan: platform
// mana yang dituju, lalu lempar ke Composer dengan platform itu sudah
// terpilih lewat query string, supaya orang tidak mendarat di halaman
// kosong dan harus mengulang keputusan yang baru saja dibuat di sini.
export default function CreatePostModal({ open, onClose }) {
  const navigate = useNavigate()
  const [dipilih, setDipilih] = useState(['instagram'])

  function toggle(key) {
    setDipilih((prev) =>
      prev.includes(key)
        ? (prev.length === 1 ? prev : prev.filter((p) => p !== key))
        : [...prev, key]
    )
  }

  function mulai() {
    navigate(`/compose?platforms=${dipilih.join(',')}`)
    onClose?.()
  }

  if (!open) return null

  return (
    <Sheet
      open
      onClose={onClose}
      title="Mau buat konten untuk platform apa?"
      description="Bisa pilih lebih dari satu — nanti tiap platform jadi konten tersendiri."
      lebar={440}
      footer={
        <button type="button" className="btn btn-primary btn-block" onClick={mulai}>
          Mulai buat konten
        </button>
      }
    >
      <div className="platform-ikon-baris" style={{ justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
        {PLATFORMS.map((p) => {
          const aktif = dipilih.includes(p.key)
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => toggle(p.key)}
              className={`platform-ikon-btn platform-ikon-btn-besar${aktif ? ' aktif' : ''}`}
              style={{ '--platform-warna': p.color, '--platform-latar': p.bg }}
              aria-pressed={aktif}
              title={p.label}
            >
              <Icon name={p.icon} size={22} />
              {aktif && (
                <span className="platform-ikon-centang">
                  <Icon name="checkmark" size={9} />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
