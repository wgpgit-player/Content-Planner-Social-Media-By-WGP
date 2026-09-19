import { useCallback, useEffect, useRef, useState } from 'react'
import AppShell from '../components/AppShell'
import Sheet from '../components/Sheet'
import Icon from '../components/Icon'
import { supabase } from '../lib/supabaseClient'
import { useTenantContext } from '../context/TenantContext'
import { unggahMediaPerpustakaan, hapusMateri, ukuranTerbaca } from '../lib/materi'

// Media Collections — perpustakaan media, diadaptasi dari Plann.
//
// BEDANYA DENGAN LAMPIRAN DI HALAMAN BRIEF
//
// LampiranMateri.jsx (di ContentDetail) menjawab "gambar untuk post INI" —
// satu berkas, terikat satu content_item. Halaman ini menjawab pertanyaan
// yang berbeda: "bahan visual apa saja yang tim ini punya", dikumpulkan
// duluan sebelum tahu akan dipakai di post yang mana. Foto produk hasil
// pemotretan bulan ini, misalnya, diunggah ke sini sekali, lalu dipakai
// berkali-kali untuk beberapa post berbeda ke depannya — bukan diunggah
// ulang tiap kali dibutuhkan.
//
// Filenya sendiri berbagi bucket privat yang sama dengan lampiran konten,
// hanya beda folder (lihat unggahMediaPerpustakaan), supaya tidak perlu
// kebijakan Storage baru.

const FILTER_SEMUA = '__semua__'
const FILTER_FAVORIT = '__favorit__'
const FILTER_TANPA_KOLEKSI = '__tanpa__'

export default function MediaCollections() {
  const { tenantId } = useTenantContext()

  const [koleksi, setKoleksi] = useState([])
  const [item, setItem] = useState([])
  const [gambar, setGambar] = useState({})
  const [filter, setFilter] = useState(FILTER_SEMUA)
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState(null)

  const [formKoleksi, setFormKoleksi] = useState(false)
  const [namaKoleksi, setNamaKoleksi] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const [mengunggah, setMengunggah] = useState(false)
  const inputBerkas = useRef(null)

  const muat = useCallback(async () => {
    if (!supabase || !tenantId) { setLoading(false); return }
    setLoading(true)
    setGalat(null)

    const [a, b] = await Promise.all([
      supabase.from('media_collections').select('id,name,created_at').eq('tenant_id', tenantId).order('name'),
      supabase.from('media_items').select('id,collection_id,asset_path,asset_mime,asset_size,label,favorit,created_at')
        .eq('tenant_id', tenantId).order('created_at', { ascending: false }),
    ])

    if (a.error) setGalat(a.error.message)
    if (b.error) setGalat(b.error.message)
    setKoleksi(a.data ?? [])
    setItem(b.data ?? [])
    setLoading(false)
  }, [tenantId])

  useEffect(() => { muat() }, [muat])

  // Tanda tangan URL diambil sekaligus untuk semua item yang sedang
  // terlihat, bukan satu-satu — pola yang sama dengan GridPreview.jsx.
  useEffect(() => {
    let batal = false
    const paths = item.map((i) => i.asset_path).filter(Boolean)
    if (paths.length === 0) { setGambar({}); return }

    supabase.storage.from('materi').createSignedUrls(paths, 3600).then(({ data }) => {
      if (batal || !data) return
      const peta = {}
      for (const d of data) if (d.signedUrl) peta[d.path] = d.signedUrl
      setGambar(peta)
    })

    return () => { batal = true }
  }, [item])

  const itemTersaring = item.filter((i) => {
    if (filter === FILTER_SEMUA) return true
    if (filter === FILTER_FAVORIT) return i.favorit
    if (filter === FILTER_TANPA_KOLEKSI) return !i.collection_id
    return i.collection_id === filter
  })

  async function buatKoleksi(e) {
    e.preventDefault()
    if (!namaKoleksi.trim()) return
    setSibuk(true)
    const { error } = await supabase.from('media_collections').insert({ tenant_id: tenantId, name: namaKoleksi.trim() })
    setSibuk(false)
    if (error) { setGalat(error.message); return }
    setNamaKoleksi('')
    setFormKoleksi(false)
    await muat()
  }

  async function hapusKoleksi(k) {
    const yakin = window.confirm(`Hapus koleksi "${k.name}"? Media di dalamnya tidak ikut terhapus, hanya jadi tanpa koleksi.`)
    if (!yakin) return
    const { error } = await supabase.from('media_collections').delete().eq('id', k.id).eq('tenant_id', tenantId)
    if (error) { setGalat(error.message); return }
    if (filter === k.id) setFilter(FILTER_SEMUA)
    await muat()
  }

  async function unggah(fileList) {
    const files = Array.from(fileList ?? [])
    if (files.length === 0) return

    setMengunggah(true)
    setGalat(null)

    const targetKoleksi = [FILTER_SEMUA, FILTER_FAVORIT, FILTER_TANPA_KOLEKSI].includes(filter) ? null : filter

    for (const file of files) {
      const hasil = await unggahMediaPerpustakaan({ file, tenantId })
      if (hasil.error) { setGalat(hasil.error); continue }

      await supabase.from('media_items').insert({
        tenant_id: tenantId,
        collection_id: targetKoleksi,
        asset_path: hasil.path,
        asset_mime: hasil.mime,
        asset_size: hasil.size,
        label: file.name.replace(/\.[^.]+$/, ''),
      })
    }

    setMengunggah(false)
    if (inputBerkas.current) inputBerkas.current.value = ''
    await muat()
  }

  async function toggleFavorit(i) {
    const { error } = await supabase.from('media_items').update({ favorit: !i.favorit }).eq('id', i.id).eq('tenant_id', tenantId)
    if (error) { setGalat(error.message); return }
    setItem((prev) => prev.map((x) => (x.id === i.id ? { ...x, favorit: !x.favorit } : x)))
  }

  async function hapusItem(i) {
    const yakin = window.confirm('Hapus media ini dari perpustakaan?')
    if (!yakin) return

    const { error } = await supabase.from('media_items').delete().eq('id', i.id).eq('tenant_id', tenantId)
    if (error) { setGalat(error.message); return }

    // Baris metadatanya dihapus dulu, baru berkasnya — kalau urutannya
    // dibalik dan penghapusan berkas gagal, metadatanya sudah hilang duluan
    // dan berkas yatim itu jadi tidak mungkin ditemukan lagi dari UI.
    await hapusMateri(i.asset_path)
    setItem((prev) => prev.filter((x) => x.id !== i.id))
  }

  const jumlahDi = (id) => item.filter((i) => i.collection_id === id).length

  if (loading) {
    return <AppShell title="Media Collections"><p className="page-subtitle">Memuat...</p></AppShell>
  }

  return (
    <AppShell
      title="Media Collections"
      description="Perpustakaan bahan visual tim, dikelompokkan supaya gampang dipakai ulang."
      maxWidth={1100}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-sm" onClick={() => setFormKoleksi(true)}>
            <Icon name="folder-outline" size={15} /> Koleksi baru
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => inputBerkas.current?.click()}
            disabled={mengunggah}
          >
            <Icon name="cloud-upload-outline" size={15} />
            {mengunggah ? 'Mengunggah...' : 'Unggah media'}
          </button>
          <input
            ref={inputBerkas}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => unggah(e.target.files)}
          />
        </div>
      }
    >
      {galat && <p className="alert alert-error" style={{ marginBottom: 14 }}>{galat}</p>}

      <div className="media-dua">
        <div className="card">
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10 }}>
            KOLEKSI
          </p>

          <button
            type="button"
            className={`row-link${filter === FILTER_SEMUA ? ' aktif' : ''}`}
            onClick={() => setFilter(FILTER_SEMUA)}
          >
            <Icon name="images-outline" size={16} />
            <span style={{ flex: 1 }}>Semua</span>
            <span className="chip">{item.length}</span>
          </button>

          <button
            type="button"
            className={`row-link${filter === FILTER_FAVORIT ? ' aktif' : ''}`}
            onClick={() => setFilter(FILTER_FAVORIT)}
          >
            <Icon name="star-outline" size={16} />
            <span style={{ flex: 1 }}>Favorit</span>
            <span className="chip">{item.filter((i) => i.favorit).length}</span>
          </button>

          <button
            type="button"
            className={`row-link${filter === FILTER_TANPA_KOLEKSI ? ' aktif' : ''}`}
            onClick={() => setFilter(FILTER_TANPA_KOLEKSI)}
          >
            <Icon name="ellipse-outline" size={16} />
            <span style={{ flex: 1 }}>Tanpa koleksi</span>
            <span className="chip">{item.filter((i) => !i.collection_id).length}</span>
          </button>

          {koleksi.length > 0 && <div className="divider" style={{ margin: '8px 0' }} />}

          {koleksi.map((k) => (
            <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button
                type="button"
                className={`row-link${filter === k.id ? ' aktif' : ''}`}
                onClick={() => setFilter(k.id)}
                style={{ flex: 1 }}
              >
                <Icon name="folder-outline" size={16} />
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {k.name}
                </span>
                <span className="chip">{jumlahDi(k.id)}</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => hapusKoleksi(k)}
                aria-label={`Hapus koleksi ${k.name}`}
                title="Hapus koleksi"
              >
                <Icon name="trash-outline" size={13} />
              </button>
            </div>
          ))}

          {koleksi.length === 0 && (
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', padding: '8px 2px', lineHeight: 1.6 }}>
              Belum ada koleksi. Buat satu untuk mulai mengelompokkan, misalnya
              per pemotretan atau per produk.
            </p>
          )}
        </div>

        <div className="card">
          {itemTersaring.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div
                style={{
                  width: 46, height: 46, borderRadius: 13, background: 'var(--accent-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                }}
              >
                <Icon name="images-outline" size={22} color="var(--accent)" />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 5 }}>Belum ada media di sini</p>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto 16px', lineHeight: 1.6 }}>
                Unggah foto atau gambar yang akan dipakai berkali-kali untuk
                beberapa postingan ke depan.
              </p>
              <button type="button" className="btn btn-primary" onClick={() => inputBerkas.current?.click()}>
                Unggah media pertama
              </button>
            </div>
          ) : (
            <div className="pustaka-grid">
              {itemTersaring.map((i) => (
                <div key={i.id} className="card" style={{ padding: 8 }}>
                  <div
                    style={{
                      width: '100%', aspectRatio: '1 / 1', borderRadius: 10, overflow: 'hidden',
                      background: 'var(--surface-1)', marginBottom: 8, position: 'relative',
                    }}
                  >
                    {gambar[i.asset_path] ? (
                      <img
                        src={gambar[i.asset_path]}
                        alt={i.label || 'Media'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="image-outline" size={22} color="var(--text-muted)" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleFavorit(i)}
                      aria-label={i.favorit ? 'Batalkan favorit' : 'Jadikan favorit'}
                      style={{
                        position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%',
                        border: 'none', cursor: 'pointer',
                        background: 'rgba(255,255,255,0.9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Icon name={i.favorit ? 'star' : 'star-outline'} size={14} color={i.favorit ? '#E0A72E' : 'var(--text-secondary)'} />
                    </button>
                  </div>

                  <p style={{
                    fontSize: 11.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginBottom: 3,
                  }}>
                    {i.label || 'Tanpa nama'}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
                    {ukuranTerbaca(i.asset_size)}
                  </p>

                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => hapusItem(i)}
                    style={{ width: '100%', color: 'var(--text-muted)' }}
                  >
                    <Icon name="trash-outline" size={13} /> Hapus
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {formKoleksi && (
        <Sheet open onClose={() => setFormKoleksi(false)} title="Koleksi baru" lebar={380}>
          <form onSubmit={buatKoleksi}>
            <label className="field-label" htmlFor="mk-nama">Nama koleksi</label>
            <input
              id="mk-nama"
              className="input"
              autoFocus
              value={namaKoleksi}
              onChange={(e) => setNamaKoleksi(e.target.value)}
              placeholder="Contoh: Pemotretan Oktober"
              style={{ marginBottom: 16 }}
            />
            <div className="sheet-aksi">
              <button type="button" className="btn" onClick={() => setFormKoleksi(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={sibuk || !namaKoleksi.trim()}>
                {sibuk ? 'Membuat...' : 'Buat'}
              </button>
            </div>
          </form>
        </Sheet>
      )}
    </AppShell>
  )
}
