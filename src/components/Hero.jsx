import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Icon from './Icon'

// Panel sapaan di kepala dashboard.
//
// Versi sebelumnya punya kotak "Mau bikin apa hari ini..." yang tidak
// tersambung ke apa pun dan empat tombol pintasan yang tidak melakukan apa-apa.
// Isinya terlihat ramai tapi tidak bisa dipakai, jadi bagian itu dibuang.
//
// Sekarang panel ini mengerjakan tiga hal yang benar-benar berguna:
//   1. menyapa dan menyebutkan apa yang perlu diperhatikan hari ini
//   2. satu tombol untuk hal yang paling sering dilakukan, yaitu bikin konten
//   3. wallpaper yang bisa diganti tim, supaya ruang kerjanya terasa milik
//      mereka sendiri dan bukan aplikasi generik
//
// Wallpaper disimpan di bucket 'branding' dengan path {tenantId}/hero.<ext>,
// URL-nya di kolom tenants.hero_background_url.

function salamUntuk(jam) {
  if (jam < 11) return 'Selamat pagi'
  if (jam < 15) return 'Selamat siang'
  if (jam < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export default function Hero({
  userName,
  tenantId,
  backgroundUrl,
  onBackgroundChange,
  jadwalHariIni = 0,
  perluDibrief = 0,
  bisaUbahWallpaper = true,
}) {
  const navigate = useNavigate()
  const [sekarang, setSekarang] = useState(new Date())
  const [uploading, setUploading] = useState(false)
  const [galat, setGalat] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setSekarang(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const adaGambar = Boolean(backgroundUrl)
  const salam = userName ? `${salamUntuk(sekarang.getHours())}, ${userName}` : salamUntuk(sekarang.getHours())

  // Kalimat kedua mengikuti keadaan sebenarnya, bukan basa-basi tetap.
  let ringkasan
  if (jadwalHariIni > 0) ringkasan = `Ada ${jadwalHariIni} konten dijadwalkan tayang hari ini.`
  else if (perluDibrief > 0) ringkasan = `${perluDibrief} konten belum punya brief.`
  else ringkasan = 'Tidak ada yang mendesak hari ini.'

  async function gantiWallpaper(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !supabase || !tenantId) return

    if (!file.type.startsWith('image/')) {
      setGalat('File harus berupa gambar.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setGalat('Ukuran gambar maksimal 5 MB.')
      return
    }

    setUploading(true)
    setGalat(null)
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${tenantId}/hero.${ext}`

      const { error: upErr } = await supabase.storage.from('branding').upload(path, file, { upsert: true })
      if (upErr) throw upErr

      const { data } = supabase.storage.from('branding').getPublicUrl(path)
      const url = `${data.publicUrl}?t=${Date.now()}`

      const { error: dbErr } = await supabase.from('tenants').update({ hero_background_url: url }).eq('id', tenantId)
      if (dbErr) throw dbErr

      onBackgroundChange?.(url)
    } catch (err) {
      setGalat(err.message || 'Gagal mengunggah gambar.')
    } finally {
      setUploading(false)
    }
  }

  async function hapusWallpaper() {
    if (!supabase || !tenantId) return
    const { error } = await supabase.from('tenants').update({ hero_background_url: null }).eq('id', tenantId)
    if (error) { setGalat(error.message); return }
    onBackgroundChange?.(null)
  }

  const teksUtama = adaGambar ? '#fff' : 'var(--text-primary)'
  const teksKedua = adaGambar ? 'rgba(255,255,255,0.82)' : 'var(--text-secondary)'

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 16,
        padding: '20px 22px',
        overflow: 'hidden',
        border: adaGambar ? 'none' : '0.5px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        background: adaGambar
          ? `linear-gradient(100deg, rgba(14,14,20,0.82) 0%, rgba(14,14,20,0.45) 55%, rgba(14,14,20,0.25) 100%), center/cover no-repeat url(${backgroundUrl})`
          : 'var(--surface-2)',
        minHeight: 104,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 220 }}>
        <p style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', color: teksUtama, marginBottom: 3 }}>
          {salam}
        </p>
        <p style={{ fontSize: 12.5, color: teksKedua }}>{ringkasan}</p>

        {galat && (
          <p style={{ fontSize: 11.5, color: adaGambar ? '#FFD4D4' : 'var(--danger)', marginTop: 8 }}>{galat}</p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/kanban')}
        >
          <Icon name="add-outline" size={15} /> Konten baru
        </button>

        {bisaUbahWallpaper && (
          <>
            <button
              type="button"
              className={adaGambar ? 'hero-pill on-image' : 'hero-pill'}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title={adaGambar ? 'Ganti wallpaper' : 'Pasang wallpaper'}
            >
              <Icon
                name={uploading ? 'reload-outline' : 'image-outline'}
                className={uploading ? 'spin' : undefined}
                size={14}
              />
              {uploading ? 'Mengunggah' : 'Wallpaper'}
            </button>

            {adaGambar && !uploading && (
              <button
                type="button"
                className="hero-pill on-image"
                onClick={hapusWallpaper}
                title="Hapus wallpaper"
              >
                <Icon name="close-outline" size={14} />
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={gantiWallpaper}
            />
          </>
        )}
      </div>
    </div>
  )
}
