import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import { safeWebUrl } from '../lib/adminCatalog'
import Icon from './Icon'

// Pengumuman dari operator, tampil di Home klien.
//
// TIGA BENTUK, SATU SUMBER
//
// Carousel di atas (bergambar, bergeser), lalu kartu penawaran, lalu
// kartu berita. Semuanya datang dari satu RPC — penyaringan sasaran dan
// masa tayangnya dikerjakan database, bukan di sini.
//
// SEMUA BISA DITUTUP
//
// Pengumuman yang tidak bisa ditutup berubah jadi gangguan permanen di
// halaman yang orang buka tiap hari. Penutupan dicatat per orang, bukan
// per workspace: kalau satu orang menutupnya, rekan setimnya masih perlu
// melihat kabar itu.

export default function PengumumanKlien() {
  const { user } = useAuth()
  const { tenantId } = useTenantContext()
  const [daftar, setDaftar] = useState([])
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    let cancelled=false
    setDaftar([]);setSlide(0)
    if(supabase && tenantId) supabase.rpc('pengumuman_untuk_saya',{p_tenant_id:tenantId}).then(({data})=>{if(!cancelled)setDaftar(data??[])})
    return ()=>{cancelled=true}
  },[tenantId])

  async function tutup(id) {
    // Dihapus dari tampilan lebih dulu, baru dicatat ke database. Menunggu
    // jaringan sebelum kartunya hilang membuat tombol tutup terasa rusak.
    setDaftar((d) => d.filter((x) => x.id !== id))
    setSlide(0)
    await supabase.from('pengumuman_ditutup').insert({ pengumuman_id: id, user_id: user.id })
  }

  const carousel = daftar.filter((d) => d.jenis === 'carousel')
  const penawaran = daftar.filter((d) => d.jenis === 'penawaran')
  const berita = daftar.filter((d) => d.jenis === 'berita')

  if (daftar.length === 0) return null

  return (
    <div style={{ marginBottom: 20 }}>
      {/* ---------- Carousel ---------- */}
      {carousel.length > 0 && (
        <div className="pgm-carousel">
          {carousel[Math.min(slide, carousel.length - 1)] && (() => {
            const c = carousel[Math.min(slide, carousel.length - 1)]
            return (
              <div key={c.id} className="pgm-slide" style={c.gambar_url ? { backgroundImage: `url(${c.gambar_url})` } : undefined}>
                <div className="pgm-slide-isi">
                  <p className="pgm-slide-judul">{c.judul}</p>
                  {c.isi && <p className="pgm-slide-teks">{c.isi}</p>}
                  {c.tautan_url && (
                    <a href={safeWebUrl(c.tautan_url)} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary"
                      style={{ marginTop: 10, textDecoration: 'none', display: 'inline-flex' }}>
                      {c.label_tombol || 'Lihat'}
                    </a>
                  )}
                </div>

                <button type="button" className="pgm-tutup" onClick={() => tutup(c.id)} aria-label="Tutup">
                  <Icon name="close" size={14} />
                </button>
              </div>
            )
          })()}

          {carousel.length > 1 && (
            <div className="pgm-titik">
              {carousel.map((c, i) => (
                <button key={c.id} type="button"
                  className={`pgm-titik-satu${i === slide ? ' aktif' : ''}`}
                  onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------- Penawaran ---------- */}
      {penawaran.map((p) => (
        <div key={p.id} className="pgm-penawaran">
          {p.gambar_url && <img src={p.gambar_url} alt="" className="pgm-penawaran-gambar" />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <Icon name="pricetag" size={13} color="var(--accent)" />
              <p style={{ fontSize: 13.5, fontWeight: 600 }}>{p.judul}</p>
            </div>
            {p.isi && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{p.isi}</p>
            )}
            {p.tautan_url && (
              <a href={safeWebUrl(p.tautan_url)} target="_blank" rel="noopener noreferrer"
                className="btn btn-sm btn-primary"
                style={{ marginTop: 10, textDecoration: 'none', display: 'inline-flex' }}>
                {p.label_tombol || 'Lihat penawaran'}
              </a>
            )}
          </div>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => tutup(p.id)} aria-label="Tutup">
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}

      {/* ---------- Berita ---------- */}
      {berita.map((b) => (
        <div key={b.id} className="pgm-berita">
          {safeWebUrl(b.gambar_url) && <img src={b.gambar_url} alt="" style={{width:80,height:65,objectFit:'cover',borderRadius:8}}/>}
          <Icon name="megaphone-outline" size={15} color="var(--text-secondary)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12.5, fontWeight: 600 }}>{b.judul}</p>
            {b.isi && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.55 }}>
                {b.isi}
              </p>
            )}
            {b.tautan_url && (
              <a href={safeWebUrl(b.tautan_url)} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4, display: 'inline-block' }}>
                {b.label_tombol || 'Selengkapnya'} →
              </a>
            )}
          </div>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => tutup(b.id)} aria-label="Tutup">
            <Icon name="close" size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}
