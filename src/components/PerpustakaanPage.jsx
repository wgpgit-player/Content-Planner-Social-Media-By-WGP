import { useState } from 'react'
import AppShell from './AppShell'
import Sheet from './Sheet'
import Icon from './Icon'
import { useLibrary } from '../lib/useLibrary'

// Satu halaman untuk ketiga perpustakaan.
//
// CTA, hook, dan formula caption sebelumnya tiga file yang isinya hampir
// sama persis: judul, filter kategori, grid kartu yang bisa disalin, dan
// modal tambah. Perbedaan nyatanya cuma dua — formula caption punya nama
// terpisah dari isinya, dan istilah kategorinya berbeda ("tujuan" vs
// "kategori"). Keduanya cukup diatur lewat prop, jadi tidak perlu tiga
// salinan kode yang harus diperbaiki bertiga setiap kali ada perubahan.

export default function PerpustakaanPage({
  kind,
  title,
  description,
  labelIsi,        // label kolom isi utama
  placeholderIsi,
  labelKategori,   // "Tujuan" untuk CTA, "Kategori" untuk hook
  placeholderKategori,
  pakaiNama = false,
  labelNama,
  placeholderNama,
  labelTambah,
  ikon,
}) {
  const { items, kategori, loading, galat, isAdmin, tambah, hapus, isiContoh } = useLibrary(kind)

  const [saringan, setSaringan] = useState('Semua')
  const [formTerbuka, setFormTerbuka] = useState(false)
  const [tersalin, setTersalin] = useState(null)
  const [sibuk, setSibuk] = useState(false)

  const [nama, setNama] = useState('')
  const [isi, setIsi] = useState('')
  const [kat, setKat] = useState('')

  const terlihat = saringan === 'Semua' ? items : items.filter((i) => i.category === saringan)

  async function salin(item) {
    const teks = pakaiNama ? `${item.title}\n\n${item.body}` : item.body
    try {
      await navigator.clipboard.writeText(teks)
      setTersalin(item.id)
      setTimeout(() => setTersalin((t) => (t === item.id ? null : t)), 1600)
    } catch {
      // Diabaikan: clipboard bisa ditolak peramban. Teksnya tetap terlihat
      // di kartu, jadi masih bisa diblok dan disalin manual.
    }
  }

  async function kirim(e) {
    e.preventDefault()
    if (!isi.trim()) return
    if (pakaiNama && !nama.trim()) return

    setSibuk(true)
    const { error } = await tambah({ title: pakaiNama ? nama : null, body: isi, category: kat })
    setSibuk(false)
    if (error) return

    setNama(''); setIsi(''); setKat('')
    setFormTerbuka(false)
  }

  return (
    <AppShell
      title={title}
      description={description}
      maxWidth={820}
      actions={
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setFormTerbuka(true)}>
          <Icon name="add-outline" size={15} /> {labelTambah}
        </button>
      }
    >
      {galat && <p className="alert alert-error" style={{ marginBottom: 14 }}>{galat}</p>}

      {kategori.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {kategori.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSaringan(k)}
              className="chip"
              style={{
                cursor: 'pointer',
                border: 'none',
                fontFamily: 'inherit',
                background: saringan === k ? 'var(--accent)' : 'var(--surface-1)',
                color: saringan === k ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
            >
              {k}
            </button>
          ))}
        </div>
      )}

      {loading && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Memuat...</p>}

      {!loading && items.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div
            style={{
              width: 46, height: 46, borderRadius: 13, background: 'var(--accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}
          >
            <Icon name={ikon} size={22} color="var(--accent)" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 5 }}>Perpustakaan masih kosong</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 16px', lineHeight: 1.6 }}>
            Isi sendiri, atau mulai dari beberapa contoh lintas industri yang
            bisa kamu ubah sesuai brand-mu. Bagian dalam kurung siku diisi
            sendiri sesuai konteks.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAdmin && (
              <button type="button" className="btn" onClick={isiContoh}>
                <Icon name="sparkles-outline" size={14} /> Isi dengan contoh
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={() => setFormTerbuka(true)}>
              {labelTambah}
            </button>
          </div>
        </div>
      )}

      {terlihat.length > 0 && (
        <div className="pustaka-grid">
          {terlihat.map((item) => (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              {item.category && (
                <span
                  className="chip"
                  style={{
                    alignSelf: 'flex-start',
                    background: 'var(--accent-bg)',
                    color: 'var(--accent)',
                    borderColor: 'transparent',
                    marginBottom: 8,
                  }}
                >
                  {item.category}
                </span>
              )}

              {pakaiNama && item.title && (
                <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 5 }}>{item.title}</p>
              )}

              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                {item.body}
              </p>

              <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '0.5px solid var(--border)' }}>
                <button type="button" className="btn btn-sm" onClick={() => salin(item)}>
                  <Icon name={tersalin === item.id ? 'checkmark-outline' : 'copy-outline'} size={14} />
                  {tersalin === item.id ? 'Tersalin' : 'Salin'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => hapus(item.id)}
                  style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}
                  aria-label="Hapus"
                >
                  <Icon name="trash-outline" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length > 0 && terlihat.length === 0 && (
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
          Tidak ada yang cocok dengan saringan “{saringan}”.
        </p>
      )}

      {formTerbuka && (
        <Sheet open onClose={() => setFormTerbuka(false)} title={labelTambah} lebar={400}>
          <form onSubmit={kirim}>
            {pakaiNama && (
              <>
                <label className="field-label" htmlFor="pustaka-nama">{labelNama}</label>
                <input
                  id="pustaka-nama"
                  className="input"
                  autoFocus
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder={placeholderNama}
                  style={{ marginBottom: 12 }}
                />
              </>
            )}

            <label className="field-label" htmlFor="pustaka-isi">{labelIsi}</label>
            <textarea
              id="pustaka-isi"
              className="textarea"
              rows={pakaiNama ? 4 : 3}
              autoFocus={!pakaiNama}
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              placeholder={placeholderIsi}
              style={{ marginBottom: 12, minHeight: 72 }}
            />

            <label className="field-label" htmlFor="pustaka-kat">{labelKategori}</label>
            <input
              id="pustaka-kat"
              className="input"
              value={kat}
              onChange={(e) => setKat(e.target.value)}
              placeholder={placeholderKategori}
              list="pustaka-kat-saran"
            />
            {/* Kategori yang sudah pernah dipakai disarankan, supaya tidak
                lahir "Edukasi" dan "edukasi" sebagai dua kategori berbeda. */}
            <datalist id="pustaka-kat-saran">
              {kategori.filter((k) => k !== 'Semua').map((k) => <option key={k} value={k} />)}
            </datalist>

            <div className="sheet-aksi">
              <button type="button" className="btn" onClick={() => setFormTerbuka(false)}>Batal</button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sibuk || !isi.trim() || (pakaiNama && !nama.trim())}
              >
                {sibuk ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </Sheet>
      )}
    </AppShell>
  )
}
