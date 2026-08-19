import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Kartu sapaan ala referensi "fitplan". Sekarang bisa dikustom dengan gambar
// wallpaper — tersimpan di Supabase Storage bucket 'branding', path
// {tenantId}/hero.<ext>, URL-nya disimpan di kolom tenants.hero_background_url.
// Kalau ada background, ditambah overlay gradient gelap tipis biar teks tetap
// terbaca; kalau tidak ada, fallback ke background surface polos (bukan lagi
// gradient ungu-pink, biar selaras sama gaya fitplan yang lebih tenang).

const SUBTEXTS = [
  'Semoga harimu produktif — ada beberapa konten yang perlu perhatian kamu.',
  'Engagement rate naik dibanding minggu lalu.',
  'Ada konten yang menunggu approval kamu.',
]

function greetingFor(hour) {
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export default function Hero({ userName = 'mas', onQuickAction, tenantId, backgroundUrl, onBackgroundChange }) {
  const [now, setNow] = useState(new Date())
  const [subtext] = useState(() => SUBTEXTS[Math.floor(Math.random() * SUBTEXTS.length)])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  const greeting = `${greetingFor(now.getHours())}, ${userName}`
  const hasImage = Boolean(backgroundUrl)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !supabase || !tenantId) return

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${tenantId}/hero.${ext}`
    const { error: uploadErr } = await supabase.storage.from('branding').upload(path, file, { upsert: true })
    if (uploadErr) {
      console.error('upload hero background error:', uploadErr)
      setUploading(false)
      return
    }
    const { data: pub } = supabase.storage.from('branding').getPublicUrl(path)
    const url = `${pub.publicUrl}?t=${Date.now()}` // cache-bust biar langsung update
    await supabase.from('tenants').update({ hero_background_url: url }).eq('id', tenantId)
    onBackgroundChange?.(url)
    setUploading(false)
  }

  async function handleRemoveBackground() {
    if (!supabase || !tenantId) return
    await supabase.from('tenants').update({ hero_background_url: null }).eq('id', tenantId)
    onBackgroundChange?.(null)
  }

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 16,
      padding: '20px 20px 16px', background: hasImage ? '#2a2438' : 'var(--surface-2)',
      backgroundImage: hasImage ? `linear-gradient(135deg, rgba(30,20,45,0.72), rgba(30,20,45,0.35)), url(${backgroundUrl})` : 'none',
      backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
        {hasImage && (
          <button
            onClick={handleRemoveBackground}
            title="Hapus wallpaper"
            style={{
              width: 26, height: 26, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.18)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className="ti ti-x" style={{ fontSize: 13 }} aria-hidden="true" />
          </button>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Ganti wallpaper"
          style={{
            width: 26, height: 26, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: hasImage ? 'rgba(255,255,255,0.18)' : 'var(--surface-1)',
            color: hasImage ? '#fff' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <i className={`ti ${uploading ? 'ti-loader-2' : 'ti-photo'}`} style={{ fontSize: 13 }} aria-hidden="true" />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
      </div>

      <p style={{ fontSize: 19, fontWeight: 600, margin: '0 0 4px', color: hasImage ? '#fff' : 'var(--text-primary)' }}>
        {greeting} <span aria-hidden="true">👋</span>
      </p>
      <p style={{ fontSize: 12.5, color: hasImage ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>{subtext}</p>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: hasImage ? 'rgba(255,255,255,0.14)' : 'var(--surface-1)',
        border: hasImage ? '0.5px solid rgba(255,255,255,0.25)' : '0.5px solid var(--border)',
        borderRadius: 10, padding: '9px 12px', marginBottom: 12,
      }}>
        <i className="ti ti-sparkles" style={{ fontSize: 14, color: hasImage ? '#fff' : 'var(--accent)' }} aria-hidden="true" />
        <span style={{ fontSize: 12.5, color: hasImage ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>Mau bikin apa hari ini...</span>
        <i className="ti ti-send-2" style={{ fontSize: 14, color: hasImage ? '#fff' : 'var(--accent)', marginLeft: 'auto', cursor: 'pointer' }} aria-hidden="true" />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button className={`hero-pill ${hasImage ? 'on-image filled' : 'filled'}`} onClick={() => onQuickAction?.('now')}>
          <i className="ti ti-bolt" aria-hidden="true" /> Sekarang
        </button>
        <button className={`hero-pill ${hasImage ? 'on-image' : ''}`} onClick={() => onQuickAction?.('draft-jadwal')}>
          <i className="ti ti-calendar-event" aria-hidden="true" /> Besok
        </button>
        <button className={`hero-pill ${hasImage ? 'on-image' : ''}`} onClick={() => onQuickAction?.('minggu-depan')}>
          <i className="ti ti-calendar-plus" aria-hidden="true" /> Minggu depan
        </button>
        <button className={`hero-pill ${hasImage ? 'on-image' : ''}`} onClick={() => onQuickAction?.('ringkas-performa')}>
          <i className="ti ti-adjustments" aria-hidden="true" /> Custom
        </button>
      </div>
    </div>
  )
}
