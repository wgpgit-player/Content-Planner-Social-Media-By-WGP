import { useCallback, useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import Sheet from '../components/Sheet'
import Icon from '../components/Icon'
import { supabase } from '../lib/supabaseClient'
import { useTenantContext } from '../context/TenantContext'

// Set hashtag.
//
// Ini fitur berbayar di Plann, dan alasannya masuk akal: menyusun ulang
// dua puluh sampai tiga puluh hashtag setiap kali posting adalah pekerjaan
// berulang yang paling sering dikeluhkan. Disimpan per pillar supaya set
// yang tepat bisa dikenali sesuai tema kontennya.
//
// Hashtag disimpan sebagai satu teks, bukan array. Yang pengguna lakukan
// dengan ini cuma satu hal: menyalin seluruhnya ke caption. Memecahnya jadi
// array berarti menyusunnya kembali setiap kali ditampilkan, tanpa ada yang
// diuntungkan.

function hitungTag(teks) {
  if (!teks) return 0
  // Dihitung dari jumlah tanda #, bukan dari jumlah kata, karena orang
  // menulis hashtag dengan pemisah yang berbeda-beda: spasi, baris baru,
  // atau menempel satu sama lain.
  return (teks.match(/#[^\s#]+/g) ?? []).length
}

export default function HashtagSets() {
  const { tenantId } = useTenantContext()

  const [daftar, setDaftar] = useState([])
  const [pillars, setPillars] = useState([])
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState(null)
  const [tersalin, setTersalin] = useState(null)
  const [formTerbuka, setFormTerbuka] = useState(false)
  const [sibuk, setSibuk] = useState(false)
  const [sedangUbah, setSedangUbah] = useState(null)

  const [nama, setNama] = useState('')
  const [tags, setTags] = useState('')
  const [pillarId, setPillarId] = useState('')

  // Katalog saran — sama untuk semua workspace, dibaca sekali (kecil, cuma
  // beberapa baris), tidak bergantung tenantId sama sekali.
  const [saran, setSaran] = useState([])
  const [pencarianSaran, setPencarianSaran] = useState('')

  const muat = useCallback(async () => {
    if (!supabase || !tenantId) { setLoading(false); return }
    setLoading(true)
    setGalat(null)

    const [a, b, s] = await Promise.all([
      supabase.from('hashtag_sets').select('id,name,tags,pillar_id,updated_at')
        .eq('tenant_id', tenantId).order('name'),
      supabase.from('content_pillars').select('id,name,color')
        .eq('tenant_id', tenantId).order('name'),
      supabase.from('hashtag_saran').select('id,kategori,tags').order('urutan'),
    ])

    if (a.error) setGalat(a.error.message)
    setDaftar(a.data ?? [])
    setPillars(b.data ?? [])
    setSaran(s.data ?? [])
    setLoading(false)
  }, [tenantId])

  useEffect(() => { muat() }, [muat])

  function bukaForm(set = null) {
    setSedangUbah(set)
    setNama(set?.name ?? '')
    setTags(set?.tags ?? '')
    setPillarId(set?.pillar_id ?? '')
    setFormTerbuka(true)
  }

  // Dari kolom saran: buka form yang sama seperti "Set baru", tapi sudah
  // terisi. Tetap dianggap "belum tersimpan" (sedangUbah null) — orang boleh
  // ubah namanya, tambah pillar, atau edit hashtagnya dulu sebelum disimpan
  // sebagai set miliknya sendiri. Katalog saran sendiri tidak pernah berubah.
  function pakaiSaran(item) {
    setSedangUbah(null)
    setNama(item.kategori)
    setTags(item.tags)
    setPillarId('')
    setFormTerbuka(true)
  }

  const saranTersaring = pencarianSaran.trim()
    ? saran.filter((s) => s.kategori.toLowerCase().includes(pencarianSaran.trim().toLowerCase()))
    : saran

  async function salin(set) {
    try {
      await navigator.clipboard.writeText(set.tags)
      setTersalin(set.id)
      setTimeout(() => setTersalin((t) => (t === set.id ? null : t)), 1600)
    } catch {
      // Diabaikan: teksnya tetap terlihat dan bisa disalin manual.
    }
  }

  async function kirim(e) {
    e.preventDefault()
    if (!nama.trim() || !tags.trim()) return

    setSibuk(true)
    const isi = {
      tenant_id: tenantId,
      name: nama.trim(),
      tags: tags.trim(),
      pillar_id: pillarId || null,
    }

    const { error } = sedangUbah
      ? await supabase.from('hashtag_sets').update(isi).eq('id', sedangUbah.id).eq('tenant_id', tenantId)
      : await supabase.from('hashtag_sets').insert(isi)

    setSibuk(false)
    if (error) { setGalat(error.message); return }

    setFormTerbuka(false)
    setSedangUbah(null)
    setNama(''); setTags(''); setPillarId('')
    await muat()
  }

  async function hapus(set) {
    const yakin = window.confirm(`Hapus set "${set.name}"?`)
    if (!yakin) return

    const { error } = await supabase.from('hashtag_sets').delete().eq('id', set.id).eq('tenant_id', tenantId)
    if (error) { setGalat(error.message); return }
    await muat()
  }

  const pillarById = Object.fromEntries(pillars.map((p) => [p.id, p]))

  return (
    <AppShell
      title="Set hashtag"
      description="Kumpulan hashtag yang bisa dipakai ulang, tinggal salin ke caption."
      maxWidth={820}
      actions={
        <button type="button" className="btn btn-primary btn-sm" onClick={() => bukaForm()}>
          <Icon name="add-outline" size={15} /> Set baru
        </button>
      }
    >
      {galat && <p className="alert alert-error" style={{ marginBottom: 14 }}>{galat}</p>}

      {loading && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Memuat...</p>}

      {/* ---------- Saran hashtag ----------
          Diadaptasi dari kolom "Suggested Hashtags" di Plann: kurasi siap
          pakai, sama untuk semua workspace. Bedanya di sini bukan pencarian
          bebas ke basis data besar — cukup beberapa kategori umum sebagai
          titik awal, karena itu yang paling sering dibutuhkan: bukan hashtag
          yang sempurna, tapi tidak mulai dari kolom kosong. */}
      {!loading && saran.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 13.5, fontWeight: 600 }}>Saran hashtag</p>
            <span className="chip" style={{ fontSize: 10.5 }}>Kurasi</span>
            <input
              className="input"
              value={pencarianSaran}
              onChange={(e) => setPencarianSaran(e.target.value)}
              placeholder="Cari kategori..."
              style={{ marginLeft: 'auto', maxWidth: 200 }}
            />
          </div>

          <div className="pustaka-grid">
            {saranTersaring.map((s) => (
              <div key={s.id} className="card" style={{ background: 'var(--surface-1)', border: '0.5px solid var(--border)' }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{s.kategori}</p>
                <p style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 10, wordBreak: 'break-word' }}>
                  {s.tags}
                </p>
                <button type="button" className="btn btn-sm" onClick={() => pakaiSaran(s)}>
                  <Icon name="add-outline" size={14} /> Pakai sebagai set baru
                </button>
              </div>
            ))}
            {saranTersaring.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>
                Tidak ada kategori yang cocok dengan "{pencarianSaran}".
              </p>
            )}
          </div>
        </div>
      )}

      {!loading && daftar.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div
            style={{
              width: 46, height: 46, borderRadius: 13, background: 'var(--accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}
          >
            <Icon name="pricetags-outline" size={22} color="var(--accent)" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 5 }}>Belum ada set hashtag</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 16px', lineHeight: 1.6 }}>
            Simpan sekali, pakai berkali-kali. Buat satu set per pillar supaya
            hashtagnya selalu cocok dengan tema kontennya.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => bukaForm()}>
            Buat set pertama
          </button>
        </div>
      )}

      {daftar.length > 0 && (
        <>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>
          SET MILIKMU
        </p>
        <div className="pustaka-grid">
          {daftar.map((set) => {
            const p = pillarById[set.pillar_id]
            return (
              <div key={set.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {set.name}
                  </p>
                  <span className="chip" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                    {hitungTag(set.tags)} tag
                  </span>
                </div>

                {p && (
                  <span
                    className="chip"
                    style={{
                      alignSelf: 'flex-start',
                      background: 'var(--surface-1)',
                      color: p.color || 'var(--text-secondary)',
                      borderColor: 'transparent',
                      marginBottom: 8,
                    }}
                  >
                    {p.name}
                  </span>
                )}

                <p
                  style={{
                    fontSize: 12.5, lineHeight: 1.65, color: 'var(--text-secondary)',
                    wordBreak: 'break-word',
                  }}
                >
                  {set.tags}
                </p>

                <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '0.5px solid var(--border)' }}>
                  <button type="button" className="btn btn-sm" onClick={() => salin(set)}>
                    <Icon name={tersalin === set.id ? 'checkmark-outline' : 'copy-outline'} size={14} />
                    {tersalin === set.id ? 'Tersalin' : 'Salin'}
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => bukaForm(set)}>
                    Ubah
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => hapus(set)}
                    style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}
                    aria-label="Hapus"
                  >
                    <Icon name="trash-outline" size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        </>
      )}

      {formTerbuka && (
        <Sheet
          open
          onClose={() => { setFormTerbuka(false); setSedangUbah(null) }}
          title={sedangUbah ? 'Ubah set hashtag' : 'Set hashtag baru'}
          lebar={420}
        >
          <form onSubmit={kirim}>
            <label className="field-label" htmlFor="hs-nama">Nama set</label>
            <input
              id="hs-nama"
              className="input"
              autoFocus
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Edukasi produk — umum"
              style={{ marginBottom: 12 }}
            />

            <label className="field-label" htmlFor="hs-pillar">Pillar (opsional)</label>
            <select
              id="hs-pillar"
              className="select"
              value={pillarId}
              onChange={(e) => setPillarId(e.target.value)}
              style={{ marginBottom: 12 }}
            >
              <option value="">Tidak dikaitkan</option>
              {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <label className="field-label" htmlFor="hs-tags">Hashtag</label>
            <textarea
              id="hs-tags"
              className="textarea"
              rows={5}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="#contoh #hashtag #ditulis #dipisah #spasi"
              style={{ minHeight: 100 }}
            />
            <p className="field-hint">
              {hitungTag(tags)} hashtag terdeteksi. Instagram membatasi 30 per
              postingan, jadi di atas itu sebagiannya diabaikan.
            </p>

            <div className="sheet-aksi">
              <button type="button" className="btn" onClick={() => { setFormTerbuka(false); setSedangUbah(null) }}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" disabled={sibuk || !nama.trim() || !tags.trim()}>
                {sibuk ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </Sheet>
      )}
    </AppShell>
  )
}
