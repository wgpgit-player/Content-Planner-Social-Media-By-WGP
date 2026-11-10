import { useState } from 'react'
import Icon from './Icon'
import { getPlatform } from '../config/platforms'
import { jalankanSmartDispatch, susunNaskahLengkap } from '../lib/smartDispatcher'
import { supabase } from '../lib/supabaseClient'

export default function SmartDispatchButton({
  item,
  targetUrl = null,
  onStatusUpdated = null,
  variant = 'primary', // 'primary' | 'outline' | 'compact'
  label = null,
}) {
  const [modalTerbuka, setModalTerbuka] = useState(false)
  const [loadingPublish, setLoadingPublish] = useState(false)
  const [statusSelesai, setStatusSelesai] = useState(false)

  if (!item) return null

  const p = getPlatform(item.platform)
  const naskah = susunNaskahLengkap(item)
  const tombolText = label || `Publikasikan ke ${p.label}`

  async function handleDispatch() {
    await jalankanSmartDispatch(item, targetUrl)
    setModalTerbuka(true)
  }

  async function tandaiSudahTayang() {
    if (!supabase || !item.id) return
    setLoadingPublish(true)

    try {
      const { error } = await supabase
        .from('content_items')
        .update({
          status: 'published',
          published_date: new Date().toISOString().slice(0, 10),
        })
        .eq('id', item.id)

      if (!error) {
        setStatusSelesai(true)
        if (onStatusUpdated) onStatusUpdated('published')
      }
    } catch (err) {
      console.warn('Gagal mengubah status tayang:', err)
    } finally {
      setLoadingPublish(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleDispatch}
        className={variant === 'primary' ? 'btn btn-primary btn-sm' : 'btn btn-sm'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: variant === 'primary' ? p.color : undefined,
          borderColor: variant === 'primary' ? p.color : undefined,
          color: variant === 'primary' ? '#fff' : p.color,
          fontWeight: 650,
          cursor: 'pointer',
        }}
        title={`Salin naskah dan buka studio ${p.label}`}
      >
        <Icon name={p.icon} size={15} color={variant === 'primary' ? '#fff' : p.color} />
        <span>{tombolText}</span>
        <Icon name="open-outline" size={13} style={{ opacity: 0.8 }} />
      </button>

      {/* Modal Konfirmasi Penerbitan */}
      {modalTerbuka && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 99999,
            padding: 16,
          }}
          onClick={() => setModalTerbuka(false)}
        >
          <div
            style={{
              background: '#fff',
              maxWidth: 480,
              width: '100%',
              borderRadius: 20,
              padding: 24,
              boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: p.bg,
                  color: p.color,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name={p.icon} size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Studio {p.label} Terbuka di Tab Baru!
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Smart Dispatcher berhasil menyiapkan naskah kontenmu
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalTerbuka(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                ×
              </button>
            </div>

            {/* Banner Sukses Salin */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 12.5,
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              <Icon name="checkmark-circle-outline" size={17} color="#059669" />
              <span>Naskah caption & hashtag sudah tersalin ke clipboard!</span>
            </div>

            {/* Cuplikan Teks */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                Langkah Eksekusi di {p.label}:
              </p>
              <ol style={{ fontSize: 12.5, color: 'var(--text-secondary)', paddingLeft: 18, margin: '4px 0 10px', lineHeight: 1.6 }}>
                <li>Beralih ke tab studio {p.label} yang baru saja terbuka.</li>
                <li>Unggah video atau gambar kontenmu.</li>
                <li>Tekan <strong>Ctrl + V</strong> (atau Paste) di kolom caption {p.label}.</li>
                <li>Klik <strong>Terbitkan / Publish</strong>.</li>
              </ol>

              {item.reference_url && (
                <div style={{ background: 'var(--surface-1, #f9fafb)', padding: '10px 12px', borderRadius: 10, marginTop: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Folder Desain / Aset Media:
                  </span>
                  <a
                    href={item.reference_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'underline', wordBreak: 'break-all' }}
                  >
                    Buka Google Drive / Canva ↗
                  </a>
                </div>
              )}
            </div>

            {/* Tombol Aksi Bawah */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setModalTerbuka(false)}
              >
                Selesai
              </button>

              {statusSelesai ? (
                <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="checkmark-done-outline" size={15} /> Ditandai Sudah Tayang!
                </span>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={tandaiSudahTayang}
                  disabled={loadingPublish}
                  style={{
                    background: '#059669',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 650,
                  }}
                >
                  <Icon name="checkmark-done-outline" size={14} />
                  {loadingPublish ? 'Menyimpan...' : 'Tandai Konten Sudah Tayang'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
