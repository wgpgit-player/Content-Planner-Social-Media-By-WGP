import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminCatalog from '../components/AdminCatalog'
import AdminAddons from '../components/AdminAddons'
import '../admin-dashboard.css'
import AppShell from '../components/AppShell'
import TabPesanan from '../components/TabPesanan'
import Sheet from '../components/Sheet'
import Icon from '../components/Icon'
import { supabase } from '../lib/supabaseClient'
import { useOperator } from '../lib/useOperator'
import { useConfirm } from '../lib/useConfirm'

// Konsol operator platform — punya pemilik aplikasi, bukan punya klien.
//
// APA YANG SENGAJA TIDAK ADA DI SINI
//
// Tidak ada cara melihat isi konten klien: tidak ada judul postingan,
// caption, atau brief. Alasannya ada di migrasi peran_operator_platform,
// dan ringkasnya: rencana konten agensi adalah rahasia dagang mereka, dan
// akses yang tidak pernah ada tidak bisa bocor kalau akun ini diambil alih.
//
// Yang ada cukup untuk menjalankan usaha: siapa pelanggannya, paket apa,
// seberapa penuh penyimpanannya, dan cara mengirimi mereka kabar.

const JENIS = [
  { key: 'berita', label: 'Iklan & kabar', icon: 'newspaper-outline', ket: 'Kartu kabar biasa di Home klien.' },
  { key: 'carousel', label: 'Carousel', icon: 'images-outline', ket: 'Slide bergambar di bagian atas Home.' },
  { key: 'penawaran', label: 'Penawaran', icon: 'pricetag-outline', ket: 'Kartu ajakan dengan tombol tindakan.' },
]

function ukuran(b) {
  if (b === null || b === undefined) return '-'
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/* ============================================================
   Tab 1 — Klien
   ============================================================ */
function TabKlien({ paketTersedia, onReload }) {
  const [cari, setCari] = useState('')
  const [filter, setFilter] = useState('')
  const [klien, setKlien] = useState([])
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState(null)
  const [sedangUbah, setSedangUbah] = useState(null)
  const [paketBaru, setPaketBaru] = useState('gratis')
  const [khususMb, setKhususMb] = useState('')
  const [sibuk, setSibuk] = useState(false)

  const muat = useCallback(async () => {
    setLoading(true)
    const [clients, extras] = await Promise.all([
      supabase.rpc('daftar_klien_operator'),
      supabase.from('tenant_addon').select('tenant_id,quantity,mulai_at,selesai_at,addon_langganan(storage_bytes)'),
    ])
    const error = clients.error || extras.error
    if (error) { setGalat(error.message); setKlien([]) }
    else {
      const now = Date.now()
      const bytes = (extras.data ?? []).reduce((totals, extra) => {
        if (Date.parse(extra.mulai_at) <= now && Date.parse(extra.selesai_at) > now)
          totals[extra.tenant_id] = (totals[extra.tenant_id] || 0) + Number(extra.addon_langganan?.storage_bytes || 0) * extra.quantity
        return totals
      }, {})
      setKlien((clients.data ?? []).map(client => ({ ...client, tambahanBytes: bytes[client.tenant_id] || 0 })))
      setGalat(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { muat() }, [muat])

  function bukaUbah(k) {
    setSedangUbah(k)
    setPaketBaru(k.paket)
    setKhususMb(k.punya_batas_khusus ? Math.round((Number(k.batas) - k.tambahanBytes) / (1024 * 1024)) : '')
    setGalat(null)
  }

  async function simpanPaket(e) {
    e.preventDefault()
    setSibuk(true)

    const khusus = khususMb === '' ? null : Math.round(Number(khususMb) * 1024 * 1024)
    const { error } = await supabase.rpc('ubah_paket_klien', {
      p_tenant_id: sedangUbah.tenant_id,
      p_paket: paketBaru,
      p_batas_khusus: khusus,
    })

    setSibuk(false)
    if (error) { setGalat(error.message); return }
    setSedangUbah(null)
    await muat()
    onReload?.()
  }

  if (loading) return <p className="page-subtitle">Memuat daftar klien...</p>

  const totalTerpakai = klien.reduce((n, k) => n + Number(k.terpakai ?? 0), 0)

  return (
    <>
      {galat && <p className="alert alert-error" style={{ marginBottom: 14 }}>{galat}</p>}

      <div className="operator-ringkas">
        <div className="metric">
          <p className="metric-label">Workspace</p>
          <p className="metric-value">{klien.length}</p>
        </div>
        <div className="metric">
          <p className="metric-label">Total penyimpanan terpakai</p>
          <p className="metric-value">{ukuran(totalTerpakai)}</p>
        </div>
        <div className="metric">
          <p className="metric-label">Berbayar</p>
          <p className="metric-value">{klien.filter((k) => !['gratis','free'].includes(k.paket)).length}</p>
        </div>
      </div>

      <div className="admin-filters"><input className="input" aria-label="Cari klien" placeholder="Cari nama workspace…" value={cari} onChange={e=>setCari(e.target.value)}/><select className="select" aria-label="Filter paket" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Semua paket</option>{paketTersedia.map(p=><option key={p.key} value={p.key}>{p.nama}</option>)}</select></div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {klien.filter(k=>k.nama.toLowerCase().includes(cari.toLowerCase()) && (!filter || k.paket===filter)).map((k) => {
          const persen = Number(k.persen ?? 0)
          const warna = persen >= 90 ? 'var(--danger)' : persen >= 75 ? 'var(--warning)' : 'var(--accent)'
          return (
            <div key={k.tenant_id} className="operator-baris">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600 }}>{k.nama}</p>
                  <span className="chip" style={{
                    background: k.paket === 'gratis' ? 'var(--surface-1)' : 'var(--accent-bg)',
                    color: k.paket === 'gratis' ? 'var(--text-secondary)' : 'var(--accent)',
                    borderColor: 'transparent',
                  }}>
                    {k.paket_nama}
                  </span>
                  {k.punya_batas_khusus && (
                    <span className="chip" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'transparent' }}>
                      batas khusus
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {k.jumlah_anggota} anggota · {k.jumlah_konten} konten · sejak{' '}
                  {new Date(k.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>

                <div className="bar-track" style={{ height: 5, marginTop: 7, maxWidth: 260 }}>
                  <div className="bar-fill" style={{ width: `${Math.min(persen, 100)}%`, background: warna }} />
                </div>
                <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>
                  {ukuran(Number(k.terpakai))} dari {ukuran(Number(k.batas))} ({persen}%)
                </p>
              </div>

              <button type="button" className="btn btn-sm" onClick={() => bukaUbah(k)}>
                Atur paket
              </button>
            </div>
          )
        })}

        {klien.length === 0 && (
          <p style={{ padding: 20, fontSize: 13, color: 'var(--text-muted)' }}>Belum ada workspace.</p>
        )}
      </div>

      {sedangUbah && (
        <Sheet open onClose={() => setSedangUbah(null)} title={sedangUbah.nama}
          description="Paket menentukan batas penyimpanan. Batas khusus menimpanya untuk klien ini saja."
          lebar={420}>
          <form onSubmit={simpanPaket}>{galat && <p role="alert" className="alert alert-error">{galat}</p>}
            <label className="field-label" htmlFor="op-paket">Paket</label>
            <select id="op-paket" className="select" value={paketBaru}
              onChange={(e) => setPaketBaru(e.target.value)} style={{ marginBottom: 12 }}>
              {paketTersedia.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.nama} — {ukuran(Number(p.batas_penyimpanan))}
                </option>
              ))}
            </select>

            <label className="field-label" htmlFor="op-khusus">Batas khusus (MB)</label>
            <input id="op-khusus" className="input" type="number" min="1" value={khususMb}
              onChange={(e) => setKhususMb(e.target.value)} placeholder="Kosongkan untuk ikut paket" />
            <p className="field-hint">
              Diisi hanya kalau ada kesepakatan khusus — misal masa percobaan diperpanjang
              atau klien besar yang minta tambahan.
            </p>

            <div className="sheet-aksi">
              <button type="button" className="btn" onClick={() => setSedangUbah(null)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={sibuk}>
                {sibuk ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </Sheet>
      )}
    </>
  )
}

/* ============================================================
   Tab 2 — Pengumuman
   ============================================================ */
function TabPengumuman({ paketTersedia, klien, jenisFilter }) {
  const [uploading, setUploading] = useState(false)
  async function uploadImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const types = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}
    if (!types[file.type] || file.size > 5 * 1024 * 1024) { setGalat('Gunakan JPG, PNG, atau WebP maksimal 5 MB.'); return }
    setUploading(true); setGalat(null)
    try {
      const bucket = supabase.storage.from('platform-promotions')
      const path = `${crypto.randomUUID()}.${types[file.type]}`
      const { error } = await bucket.upload(path, file, { contentType: file.type, upsert: false })
      if (error) throw error
      const { data } = bucket.getPublicUrl(path)
      setForm(f => f ? { ...f, gambar_url: data.publicUrl } : f)
    } catch (error) { setGalat(error.message) }
    finally { setUploading(false) }
  }
  const tanya = useConfirm()
  const [daftar, setDaftar] = useState([])
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState(null)
  const [form, setForm] = useState(null)
  const [sibuk, setSibuk] = useState(false)

  const muat = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('pengumuman')
      .select('*, pengumuman_tenant(tenant_id)')
      .order('urutan')
      .order('created_at', { ascending: false })
    if (error) setGalat(error.message)
    else setDaftar(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { muat() }, [muat])

  function bukaBaru(jenis) {
    setForm({
      jenis, judul: '', isi: '', gambar_url: '', tautan_url: '', label_tombol: '',
      sasaran: 'semua', target_paket: [], target_tenant: [], aktif: false, urutan: 0, mulai_at: '', selesai_at: '',
    })
    setGalat(null)
  }

  function bukaUbah(p) {
    setForm({
      id: p.id, jenis: p.jenis, judul: p.judul, isi: p.isi ?? '',
      gambar_url: p.gambar_url ?? '', tautan_url: p.tautan_url ?? '',
      label_tombol: p.label_tombol ?? '',
      sasaran: p.target_semua ? 'semua' : (p.target_paket?.length ? 'paket' : 'klien'),
      target_paket: p.target_paket ?? [],
      target_tenant: (p.pengumuman_tenant ?? []).map((x) => x.tenant_id),
      aktif: p.aktif, urutan: p.urutan, mulai_at: localDate(p.mulai_at), selesai_at: localDate(p.selesai_at),
    })
    setGalat(null)
  }

  async function simpan(e) {
    e.preventDefault()
    if (!form.judul.trim()) { setGalat('Judul belum diisi.'); return }

    if(form.sasaran==='paket' && !form.target_paket.length || form.sasaran==='klien' && !form.target_tenant.length){setGalat('Pilih minimal satu sasaran.');return}
    if(form.mulai_at && form.selesai_at && form.selesai_at<=form.mulai_at){setGalat('Waktu selesai harus setelah mulai.');return}
    if([form.gambar_url,form.tautan_url].some(v=>v && !/^https?:\/\//i.test(v))){setGalat('Gunakan tautan HTTP atau HTTPS.');return}
    setSibuk(true)
    setGalat(null)

    const baris = {
      jenis: form.jenis,
      judul: form.judul.trim(),
      isi: form.isi.trim() || null,
      gambar_url: form.gambar_url.trim() || null,
      tautan_url: form.tautan_url.trim() || null,
      label_tombol: form.label_tombol.trim() || null,
      target_semua: form.sasaran === 'semua',
      target_paket: form.sasaran === 'paket' ? form.target_paket : null,
      aktif: form.aktif,
      urutan: Number(form.urutan) || 0,
    }

    const { error } = await supabase.rpc('simpan_kampanye', {p_data: {...baris,id:form.id || null,target_paket:baris.target_paket || [],mulai_at:form.mulai_at ? new Date(form.mulai_at).toISOString() : null,selesai_at:form.selesai_at ? new Date(form.selesai_at).toISOString() : null},p_targets:form.sasaran==='klien'?form.target_tenant:[]})
    if(error){setSibuk(false);setGalat(error.message);return}

    setSibuk(false)
    setForm(null)
    await muat()
  }

  async function hapus(p) {
    const yakin = await tanya.ask({
      title: `Hapus "${p.judul}"?`,
      description: 'Pengumuman ini langsung hilang dari dashboard semua klien.',
    })
    if (!yakin) return

    const { error } = await supabase.from('pengumuman').delete().eq('id', p.id)
    if (error) { setGalat(error.message); return }
    await muat()
  }

  async function toggleAktif(p) {
    const { error } = await supabase.from('pengumuman').update({ aktif: !p.aktif }).eq('id', p.id)
    if (error) { setGalat(error.message); return }
    await muat()
  }

  if (loading) return <p className="page-subtitle">Memuat pengumuman...</p>

  return (
    <>
      {galat && <p className="alert alert-error" style={{ marginBottom: 14 }}>{galat}</p>}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {JENIS.filter(j=>!jenisFilter || j.key===jenisFilter).map((j) => (
          <button key={j.key} type="button" className="btn btn-sm" onClick={() => bukaBaru(j.key)}>
            <Icon name={j.icon} size={14} /> {j.label} baru
          </button>
        ))}
      </div>

      {daftar.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Belum ada pengumuman. Buat satu untuk menyapa klien di dashboard mereka.
          </p>
        </div>
      )}

      {daftar.filter(p=>!jenisFilter || p.jenis===jenisFilter).map((p) => {
        const j = JENIS.find((x) => x.key === p.jenis) ?? JENIS[0]
        const sasaran = p.target_semua ? 'Semua klien'
          : p.target_paket?.length ? `Paket: ${p.target_paket.join(', ')}`
          : `${p.pengumuman_tenant?.length ?? 0} klien terpilih`
        return (
          <div key={p.id} className="card" style={{ marginBottom: 10, opacity: p.aktif ? 1 : 0.55 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: 'var(--accent-bg)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={j.icon} size={16} />
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13.5, fontWeight: 600 }}>{p.judul}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {j.label} · {sasaran} · {!p.aktif ? 'Draf / nonaktif' : p.selesai_at && new Date(p.selesai_at)<new Date() ? 'Selesai' : p.mulai_at && new Date(p.mulai_at)>new Date() ? 'Terjadwal' : 'Tayang'} · Urutan {p.urutan}
                </p>
                {p.isi && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.55 }}>
                    {p.isi.length > 120 ? p.isi.slice(0, 120) + '…' : p.isi}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => toggleAktif(p)}
                  aria-label={p.aktif ? 'Nonaktifkan' : 'Aktifkan'} title={p.aktif ? 'Nonaktifkan' : 'Aktifkan'}>
                  <Icon name={p.aktif ? 'eye-outline' : 'eye-off-outline'} size={14} />
                </button>
                <button type="button" className="btn btn-sm btn-ghost" aria-label="Ubah kampanye" onClick={() => bukaUbah(p)}>
                  <Icon name="create-outline" size={14} />
                </button>
                <button type="button" className="btn btn-sm btn-ghost" aria-label="Hapus kampanye" onClick={() => hapus(p)}
                  style={{ color: 'var(--danger)' }}>
                  <Icon name="trash-outline" size={14} />
                </button>
              </div>
            </div>
          </div>
        )
      })}

      {form && (
        <Sheet open onClose={() => {if(!sibuk && !uploading)setForm(null)}}
          title={`${form.id ? 'Ubah' : 'Buat'} ${JENIS.find((x) => x.key === form.jenis)?.label}`}
          description={JENIS.find((x) => x.key === form.jenis)?.ket}
          lebar={760}>
          <form onSubmit={simpan} className="admin-campaign-form">
            {galat && <p role="alert" className="alert alert-error">{galat}</p>}
            <div className="admin-preview"><span>PRATINJAU DI DASHBOARD KLIEN</span>{/^https?:\/\//i.test(form.gambar_url) && <img src={form.gambar_url} alt="Pratinjau gambar promosi"/>}<h3>{form.judul || 'Judul kampanye Anda'}</h3><p>{form.isi || 'Ceritakan manfaat penawaran untuk klien Anda.'}</p>{form.tautan_url && <span className="btn btn-primary">{form.label_tombol || 'Lihat penawaran'}</span>}</div>
            <label className="field-label" htmlFor="pg-judul">Judul</label>
            <input id="pg-judul" className="input" autoFocus value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
              style={{ marginBottom: 12 }} />

            <label className="field-label" htmlFor="pg-isi">Isi</label>
            <textarea id="pg-isi" className="textarea" rows={3} value={form.isi}
              onChange={(e) => setForm({ ...form, isi: e.target.value })}
              style={{ minHeight: 70, marginBottom: 12 }} />

            {true && (
              <>
                <label className="field-label" htmlFor="pg-gambar">Tautan gambar</label>
                <label className="admin-upload">{uploading ? 'Mengunggah gambar…' : 'Unggah gambar banner'}<input aria-label="Unggah gambar banner" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || sibuk} onChange={uploadImage}/><small>JPG, PNG, atau WebP · maksimal 5 MB. Atau gunakan tautan di bawah.</small></label>
                <input id="pg-gambar" className="input" type="url" value={form.gambar_url}
                  onChange={(e) => setForm({ ...form, gambar_url: e.target.value })}
                  placeholder="https://..." style={{ marginBottom: 12 }} />
              </>
            )}

            <div className="sheet-kolom" style={{ marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="field-label" htmlFor="pg-tautan">Tautan tombol</label>
                <input id="pg-tautan" className="input" type="url" value={form.tautan_url}
                  onChange={(e) => setForm({ ...form, tautan_url: e.target.value })}
                  placeholder="https://..." />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="field-label" htmlFor="pg-label">Teks tombol</label>
                <input id="pg-label" className="input" value={form.label_tombol}
                  onChange={(e) => setForm({ ...form, label_tombol: e.target.value })}
                  placeholder="Lihat penawaran" />
              </div>
            </div>

            <label className="field-label">Ditujukan ke</label>
            <select className="select" value={form.sasaran}
              onChange={(e) => setForm({ ...form, sasaran: e.target.value })}
              style={{ marginBottom: 10 }}>
              <option value="semua">Semua klien</option>
              <option value="paket">Klien pada paket tertentu</option>
              <option value="klien">Klien tertentu</option>
            </select>

            {form.sasaran === 'paket' && (
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
                {paketTersedia.map((p) => {
                  const aktif = form.target_paket.includes(p.key)
                  return (
                    <button key={p.key} type="button" className="chip"
                      style={{
                        cursor: 'pointer', fontFamily: 'inherit', padding: '6px 11px',
                        border: `1px solid ${aktif ? 'var(--accent)' : 'var(--border)'}`,
                        background: aktif ? 'var(--accent-bg)' : 'var(--surface-2)',
                        color: aktif ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                      onClick={() => setForm({
                        ...form,
                        target_paket: aktif
                          ? form.target_paket.filter((x) => x !== p.key)
                          : [...form.target_paket, p.key],
                      })}>
                      {p.nama}
                    </button>
                  )
                })}
              </div>
            )}

            {form.sasaran === 'klien' && (
              <div className="sheet-daftar" style={{ marginBottom: 12, maxHeight: 190, overflowY: 'auto' }}>
                {klien.map((k) => {
                  const aktif = form.target_tenant.includes(k.tenant_id)
                  return (
                    <button key={k.tenant_id} type="button" className="sheet-baris"
                      onClick={() => setForm({
                        ...form,
                        target_tenant: aktif
                          ? form.target_tenant.filter((x) => x !== k.tenant_id)
                          : [...form.target_tenant, k.tenant_id],
                      })}>
                      <span className="sheet-baris-ikon">
                        <Icon name={aktif ? 'checkbox-outline' : 'square-outline'} size={16} />
                      </span>
                      <span className="sheet-baris-label">{k.nama}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="admin-filters"><label>Mulai tayang<input type="datetime-local" className="input" value={form.mulai_at} onChange={e=>setForm({...form,mulai_at:e.target.value})}/></label><label>Selesai tayang<input type="datetime-local" className="input" value={form.selesai_at} onChange={e=>setForm({...form,selesai_at:e.target.value})}/></label></div><label className="field-label">Urutan tampil (angka kecil lebih dahulu)<input className="input" type="number" step="1" value={form.urutan} onChange={e=>setForm({...form,urutan:e.target.value})}/></label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, marginBottom: 4 }}>
              <input type="checkbox" checked={form.aktif}
                onChange={(e) => setForm({ ...form, aktif: e.target.checked })} />
              Aktifkan sesuai jadwal (kosongkan jadwal untuk langsung tayang)
            </label>

            <div className="sheet-aksi">
              <button type="button" className="btn" disabled={sibuk || uploading} onClick={() => setForm(null)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={sibuk || uploading}>
                {sibuk ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </Sheet>
      )}

      {tanya.dialog}
    </>
  )
}

/* ============================================================
   Halaman
   ============================================================ */
export default function Operator() {
  const { isOperator, loading } = useOperator()
  const [tab, setTab] = useState('ringkasan')
  const [loadError,setLoadError]=useState('')
  const [revision,setRevision]=useState(0)
  const [paket, setPaket] = useState([])
  const [klien, setKlien] = useState([])

  useEffect(() => {
    if (!isOperator || !supabase) return
    supabase.from('paket_langganan').select('*').order('urutan')
      .then(({ data,error }) => {if(error)setLoadError(error.message);else setPaket(data ?? [])})
    supabase.rpc('daftar_klien_operator')
      .then(({ data,error }) => {if(error)setLoadError(error.message);else setKlien(data ?? [])})
  }, [isOperator,revision])

  if (loading) {
    return <AppShell title="Konsol operator"><p className="page-subtitle">Memeriksa akses...</p></AppShell>
  }

  // Penjaga sesungguhnya ada di database; ini hanya supaya halamannya
  // tidak tampil setengah jadi lalu setiap tombolnya gagal.
  if (!isOperator) {
    return (
      <AppShell title="Konsol operator">
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Halaman ini hanya untuk operator platform.
          </p>
        </div>
      </AppShell>
    )
  }

  const menus=[['ringkasan','Ringkasan','grid-outline'],['klien','Klien','people-outline'],['pesanan','Pesanan & bayar','receipt-outline'],['paket','Paket & harga','diamond-outline'],['berita','Iklan & kabar','megaphone-outline'],['carousel','Carousel','images-outline'],['penawaran','Penawaran','pricetag-outline']]
  return <div className="admin-shell">
    <aside className="admin-sidebar"><Link to="/home" className="admin-brand">planner<span>sm.</span></Link><span className="admin-owner">ADMIN PLATFORM</span><nav aria-label="Menu admin">{menus.map(([key,label,icon])=><button key={key} aria-current={tab===key?'page':undefined} className={tab===key?'active':''} onClick={()=>setTab(key)}><Icon name={icon} size={20}/>{label}</button>)}</nav><Link className="admin-back" to="/home"><Icon name="arrow-back-outline" size={18}/>Dashboard klien</Link><div className="admin-sidebar-note"><Icon name="shield-checkmark-outline" size={24}/><strong>Ruang khusus pemilik</strong><p>Kelola layanan dan jalin hubungan dengan klien Anda.</p></div></aside>
    <main className="admin-main"><header className="admin-top"><span>Workspace / Admin platform</span><span className="admin-avatar">A</span></header><div className="admin-heading"><div><p className="admin-eyebrow">PUSAT PENGELOLAAN</p><h1>{menus.find(m=>m[0]===tab)?.[1]}</h1><p>Semua kebutuhan bisnis Anda, dalam satu ruang.</p></div><span className="admin-access"><Icon name="lock-closed-outline" size={14}/>Akses pemilik</span></div>
    <section key={tab} className="admin-content">{loadError && <p role="alert" className="alert alert-error">Gagal memuat data: {loadError}</p>}
    {tab==='ringkasan' && <><div className="admin-welcome"><div><span>SELAMAT DATANG KEMBALI</span><h2>Bisnis tertata.<br/>Klien tetap terhubung.</h2><p>Kelola paket dan hadirkan penawaran yang tepat untuk setiap klien.</p><button className="btn btn-primary" onClick={()=>setTab('penawaran')}>Buat penawaran <Icon name="arrow-forward-outline" size={17}/></button></div><div className="admin-art" aria-hidden="true"><Icon name="business-outline" size={70}/><span>✦</span></div></div><div className="admin-stats"><article><span>Workspace klien</span><strong>{klien.length}</strong></article><article><span>Paket berbayar</span><strong>{klien.filter(k=>!['gratis','free'].includes(k.paket)).length}</strong></article><article><span>Pilihan paket</span><strong>{paket.length}</strong></article></div><h2 className="admin-section-title">Mulai dari sini</h2><div className="admin-shortcuts">{menus.slice(1).map(([key,label,icon])=><button key={key} onClick={()=>setTab(key)}><Icon name={icon} size={26}/><strong>{label}</strong><span>Kelola sekarang →</span></button>)}</div></>}
    {tab==='klien' && <TabKlien paketTersedia={paket} onReload={()=>setRevision(r=>r+1)}/>}
    {tab==='pesanan' && <TabPesanan/>}
    {tab==='paket' && <><AdminCatalog plans={paket} onChange={setPaket}/><AdminAddons clients={klien}/></>}
    {['berita','carousel','penawaran'].includes(tab) && <TabPengumuman key={tab} jenisFilter={tab} paketTersedia={paket} klien={klien}/>}
    </section></main></div>
}

function localDate(value){if(!value)return '';const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
