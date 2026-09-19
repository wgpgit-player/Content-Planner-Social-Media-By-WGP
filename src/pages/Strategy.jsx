import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Sheet from '../components/Sheet'
import Icon from '../components/Icon'
import { supabase } from '../lib/supabaseClient'
import { useTenantContext } from '../context/TenantContext'
import { useConfirm } from '../lib/useConfirm'
import { PLATFORMS, getPlatform } from '../config/platforms'
import { isoDate, startOfWeek, todayIso } from '../lib/dates'

// Strategi konten.
//
// Ini menjawab pertanyaan yang paling sering bikin orang mandek, dan yang
// tidak dijawab oleh papan Kanban maupun kalender: besok posting apa.
//
// Caranya: susun POLA tema — misalnya Edukasi, Produk, Testimoni, Edukasi,
// Cerita — lalu tanam pola itu jadi slot terjadwal. Yang lahir bukan konten
// jadi, melainkan tempat kosong yang sudah punya tema dan tanggal. Mengisi
// tempat kosong yang sudah bertema jauh lebih mudah daripada menghadapi
// kalender kosong.
//
// Focus notes di bawahnya adalah bagian yang gampang diremehkan. Tiga
// pertanyaan mingguan itu yang memisahkan perencana dari penjadwal: tempat
// mencatat apa yang sedang diuji dan apa yang ternyata berhasil, supaya
// keputusan bulan depan tidak diambil dari ingatan.

// Template pola siap pakai, ala "Start with a template" di Plann.
//
// Disimpan sebagai URUTAN NAMA pillar, bukan urutan id — karena template ini
// sama untuk semua workspace, sedangkan id pillar hanya ada setelah dibuat
// di workspace masing-masing. Saat template dipakai, tiap nama dicocokkan
// ke pillar yang sudah ada (tidak peka besar-kecil huruf); yang belum ada
// dibuatkan otomatis dengan warna dari WARNA_TEMPLATE, supaya orang tidak
// perlu bikin pillar satu-satu dulu sebelum bisa mencoba pola ini.
const TEMPLATE_POLA = [
  {
    key: 'seimbang',
    nama: 'Ritme mingguan seimbang',
    deskripsi: 'Campuran rata: edukasi, produk, cerita, testimoni, komunitas.',
    urutan: ['Edukasi', 'Produk', 'Cerita', 'Testimoni', 'Komunitas'],
  },
  {
    key: 'jualan',
    nama: 'Fokus jualan',
    deskripsi: 'Lebih berat ke produk dan promosi, diselingi testimoni.',
    urutan: ['Produk', 'Promosi', 'Testimoni', 'Produk', 'Edukasi', 'Promosi'],
  },
  {
    key: 'kepercayaan',
    nama: 'Bangun kepercayaan',
    deskripsi: 'Lebih banyak edukasi dan di balik layar, promosi diperkecil.',
    urutan: ['Edukasi', 'Dibalik Layar', 'Testimoni', 'Edukasi', 'Komunitas'],
  },
]

const WARNA_TEMPLATE = ['#6B5EE0', '#2563A8', '#A33333', '#3E7C8C', '#B4467F', '#9A5B0E']

function seninDariMinggu(d = new Date()) {
  // startOfWeek() memulai dari Minggu. Focus notes memakai Senin karena
  // itu yang orang maksud dengan "minggu ini" saat bicara kerja.
  const minggu = startOfWeek(d)
  const senin = new Date(minggu)
  senin.setDate(senin.getDate() + 1)
  return senin
}

export default function Strategy() {
  const navigate = useNavigate()
  const { tenantId } = useTenantContext()
  const tanya = useConfirm()

  const [pillars, setPillars] = useState([])
  const [daftarStrategi, setDaftarStrategi] = useState([])
  const [aktif, setAktif] = useState(null)
  const [pola, setPola] = useState([])
  const [nama, setNama] = useState('')
  const [platform, setPlatform] = useState('instagram')

  const [loading, setLoading] = useState(true)
  const [sibuk, setSibuk] = useState(false)
  const [pesan, setPesan] = useState(null)
  const [dipilih, setDipilih] = useState(null)
  const [formTanam, setFormTanam] = useState(false)
  const [formTemplate, setFormTemplate] = useState(false)
  const [menerapkanTemplate, setMenerapkanTemplate] = useState(null)

  const [mulai, setMulai] = useState(() => todayIso())
  const [jarak, setJarak] = useState(2)
  const [jamTanam, setJamTanam] = useState('')

  // Focus notes
  const [catatan, setCatatan] = useState({ goal: '', testing: '', works_well: '' })
  const [simpanCatatan, setSimpanCatatan] = useState(false)
  const mingguIni = isoDate(seninDariMinggu())

  const muat = useCallback(async () => {
    if (!supabase || !tenantId) { setLoading(false); return }
    setLoading(true)

    const [a, b, c] = await Promise.all([
      supabase.from('content_pillars').select('id,name,color,description').eq('tenant_id', tenantId).order('name'),
      supabase.from('content_strategies').select('id,name,platform,pattern,updated_at')
        .eq('tenant_id', tenantId).order('updated_at', { ascending: false }),
      supabase.from('focus_notes').select('goal,testing,works_well')
        .eq('tenant_id', tenantId).eq('week_start', mingguIni).maybeSingle(),
    ])

    setPillars(a.data ?? [])
    setDaftarStrategi(b.data ?? [])
    setCatatan({
      goal: c.data?.goal ?? '',
      testing: c.data?.testing ?? '',
      works_well: c.data?.works_well ?? '',
    })

    // Strategi terakhir yang disentuh dibuka otomatis. Halaman ini nyaris
    // selalu dibuka untuk melanjutkan yang sudah ada, bukan memulai dari nol.
    const pertama = (b.data ?? [])[0]
    if (pertama) {
      setAktif(pertama.id)
      setPola(Array.isArray(pertama.pattern) ? pertama.pattern : [])
      setNama(pertama.name)
      setPlatform(pertama.platform)
    }

    setLoading(false)
  }, [tenantId, mingguIni])

  useEffect(() => { muat() }, [muat])

  const pillarById = Object.fromEntries(pillars.map((p) => [p.id, p]))

  function pilihStrategi(id) {
    const s = daftarStrategi.find((x) => x.id === id)
    setAktif(id)
    setDipilih(null)
    if (!s) { setPola([]); setNama(''); return }
    setPola(Array.isArray(s.pattern) ? s.pattern : [])
    setNama(s.name)
    setPlatform(s.platform)
  }

  function tambahKePola(pillarId) {
    setPola((p) => (p.length >= 60 ? p : [...p, pillarId]))
  }

  function hapusDariPola(indeks) {
    setPola((p) => p.filter((_, i) => i !== indeks))
    setDipilih(null)
  }

  // Menukar dengan ketuk-lalu-ketuk, bukan geser. Alasannya sama seperti di
  // grid pratinjau: tarik-lepas HTML5 tidak bekerja di ponsel sama sekali.
  function ketukUbin(indeks) {
    if (dipilih === null) { setDipilih(indeks); return }
    if (dipilih === indeks) { setDipilih(null); return }
    setPola((p) => {
      const baru = [...p]
      ;[baru[dipilih], baru[indeks]] = [baru[indeks], baru[dipilih]]
      return baru
    })
    setDipilih(null)
  }

  // Menerapkan template: cocokkan tiap nama di urutan template ke pillar
  // yang sudah ada (tidak peka besar-kecil huruf); yang belum ada dibuatkan
  // langsung, supaya polanya bisa langsung diisi tanpa jeda bikin pillar
  // satu-satu dulu. Pillar baru dimasukkan ke daftar pillars di layar tanpa
  // perlu muat ulang semuanya.
  async function pakaiTemplate(tpl) {
    setMenerapkanTemplate(tpl.key)
    setPesan(null)

    let pillarSekarang = pillars
    const polaBaru = []
    let warnaIndeks = pillarSekarang.length

    for (const namaIni of tpl.urutan) {
      const cocok = pillarSekarang.find((p) => p.name.toLowerCase() === namaIni.toLowerCase())
      if (cocok) {
        polaBaru.push(cocok.id)
        continue
      }

      const warna = WARNA_TEMPLATE[warnaIndeks % WARNA_TEMPLATE.length]
      warnaIndeks += 1

      const { data, error } = await supabase
        .from('content_pillars')
        .insert({ tenant_id: tenantId, name: namaIni, color: warna })
        .select('id,name,color,description')
        .single()

      if (error) {
        setPesan({ tipe: 'error', teks: `Gagal membuat pillar "${namaIni}": ${error.message}` })
        setMenerapkanTemplate(null)
        return
      }

      pillarSekarang = [...pillarSekarang, data]
      polaBaru.push(data.id)
    }

    setPillars(pillarSekarang)
    setPola(polaBaru)
    setNama((n) => n.trim() ? n : tpl.nama)
    setDipilih(null)
    setMenerapkanTemplate(null)
    setFormTemplate(false)
    setPesan({
      tipe: 'sukses',
      teks: `Template "${tpl.nama}" diterapkan. Simpan dulu sebelum ditanam ke jadwal.`,
    })
  }

  async function simpan() {
    if (!nama.trim()) {
      setPesan({ tipe: 'error', teks: 'Beri nama dulu strateginya.' })
      return
    }
    setSibuk(true)
    setPesan(null)

    const isi = { tenant_id: tenantId, name: nama.trim(), platform, pattern: pola }

    const { data, error } = aktif
      ? await supabase.from('content_strategies').update(isi).eq('id', aktif).eq('tenant_id', tenantId).select('id').single()
      : await supabase.from('content_strategies').insert(isi).select('id').single()

    setSibuk(false)
    if (error) { setPesan({ tipe: 'error', teks: error.message }); return }

    setAktif(data.id)
    setPesan({ tipe: 'sukses', teks: 'Strategi tersimpan.' })
    await muat()
  }

  async function tanam(e) {
    e.preventDefault()
    if (!aktif) {
      setPesan({ tipe: 'error', teks: 'Simpan dulu strateginya sebelum ditanam.' })
      setFormTanam(false)
      return
    }

    setSibuk(true)
    const { data, error } = await supabase.rpc('tanam_strategi', {
      p_strategy_id: aktif,
      p_mulai: mulai,
      p_jarak_hari: Number(jarak) || 2,
      p_jam: jamTanam || null,
    })
    setSibuk(false)
    setFormTanam(false)

    if (error) { setPesan({ tipe: 'error', teks: error.message }); return }

    setPesan({
      tipe: 'sukses',
      teks: `${data} slot konten dibuat di kalender, mulai ${mulai}. Semuanya berstatus ide dan tinggal diisi.`,
    })
  }

  async function batalkanTanam() {
    const yakin = await tanya.ask({
      title: `Hapus strategi "${nama || 'ini'}"?`,
      description: 'Semua konten yang lahir dari strategi ini ikut terhapus dari kalender, termasuk yang sudah kamu isi briefnya. Tindakan ini tidak bisa dibatalkan.',
      labelConfirm: 'Hapus',
    })
    if (!yakin) return

    const { error } = await supabase
      .from('content_items')
      .delete()
      .eq('strategy_id', aktif)
      .eq('tenant_id', tenantId)

    if (error) { setPesan({ tipe: 'error', teks: error.message }); return }
    setPesan({ tipe: 'info', teks: 'Slot dari strategi ini sudah dihapus.' })
  }

  async function simpanCatatanMingguan() {
    setSimpanCatatan(true)
    const { error } = await supabase.from('focus_notes').upsert(
      {
        tenant_id: tenantId,
        week_start: mingguIni,
        goal: catatan.goal.trim() || null,
        testing: catatan.testing.trim() || null,
        works_well: catatan.works_well.trim() || null,
      },
      { onConflict: 'tenant_id,week_start' }
    )
    setSimpanCatatan(false)
    if (error) { setPesan({ tipe: 'error', teks: error.message }); return }
    setPesan({ tipe: 'sukses', teks: 'Catatan minggu ini tersimpan.' })
  }

  if (loading) {
    return <AppShell title="Strategi konten"><p className="page-subtitle">Memuat...</p></AppShell>
  }

  return (
    <AppShell
      title="Strategi konten"
      description="Susun pola temanya sekali, lalu tanam jadi jadwal sebulan."
      maxWidth={900}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-sm" onClick={() => setFormTemplate(true)}>
            <Icon name="grid-outline" size={15} /> Templates
          </button>
          <button type="button" className="btn btn-sm" onClick={simpan} disabled={sibuk}>
            {sibuk ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setFormTanam(true)}
            disabled={pola.length === 0}
          >
            <Icon name="calendar-outline" size={15} /> Tanam ke jadwal
          </button>
        </div>
      }
    >
      {pesan && (
        <p className={`alert alert-${pesan.tipe === 'error' ? 'error' : pesan.tipe === 'sukses' ? 'success' : 'info'}`}
           style={{ marginBottom: 14 }}>
          {pesan.teks}
        </p>
      )}

      {pillars.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div
            style={{
              width: 46, height: 46, borderRadius: 13, background: 'var(--accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}
          >
            <Icon name="layers-outline" size={22} color="var(--accent)" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 5 }}>Belum ada content pillar</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 16px', lineHeight: 1.6 }}>
            Strategi dibangun dari pillar, jadi buat dulu beberapa tema besar
            yang jadi payung kontenmu.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/content-pillar')}>
            Buat content pillar
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="sheet-kolom" style={{ marginBottom: 4 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="field-label" htmlFor="st-pilih">Strategi</label>
                <select id="st-pilih" className="select" value={aktif ?? ''}
                  onChange={(e) => pilihStrategi(e.target.value)}>
                  <option value="">Strategi baru</option>
                  {daftarStrategi.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="field-label" htmlFor="st-nama">Nama</label>
                <input id="st-nama" className="input" value={nama}
                  onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Ritme Oktober" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="field-label" htmlFor="st-platform">Platform</label>
                <select id="st-platform" className="select" value={platform}
                  onChange={(e) => setPlatform(e.target.value)}>
                  {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="strategi-dua">
            <div className="card">
              <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>Pillar kamu</p>
              <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 10 }}>
                Ketuk untuk menambahkannya ke pola.
              </p>

              {pillars.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="row-link"
                  onClick={() => tambahKePola(p.id)}
                  style={{ marginLeft: -10, marginRight: -10, width: 'calc(100% + 20px)' }}
                >
                  <span
                    style={{
                      width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                      background: p.color ?? 'var(--border-strong)',
                    }}
                  />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 13, display: 'block' }}>{p.name}</span>
                    {p.description && (
                      <span style={{
                        fontSize: 11, color: 'var(--text-muted)', display: 'block',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {p.description}
                      </span>
                    )}
                  </span>
                  <Icon name="add-outline" size={16} color="var(--text-muted)" />
                </button>
              ))}
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                <p style={{ fontSize: 13.5, fontWeight: 600 }}>Pola tayang</p>
                <span className="chip" style={{ marginLeft: 'auto' }}>{pola.length} slot</span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 10 }}>
                Urutannya adalah urutan tayang. Ketuk dua ubin untuk menukar
                posisinya.
              </p>

              {pola.length === 0 ? (
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
                  Masih kosong. Ketuk pillar di sebelah untuk mulai menyusun.
                </p>
              ) : (
                <>
                  <div className="ig-grid">
                    {pola.map((pid, i) => {
                      const p = pillarById[pid]
                      const warna = p?.color ?? 'var(--border-strong)'
                      const terpilih = dipilih === i
                      return (
                        <div
                          key={`${pid}-${i}`}
                          className={`ig-sel${terpilih ? ' terpilih' : ''}`}
                          onClick={() => ketukUbin(i)}
                          style={{
                            background: p ? `color-mix(in srgb, ${warna} 16%, #fff)` : 'var(--danger-bg)',
                            borderColor: terpilih ? 'var(--accent)' : 'transparent',
                            position: 'relative',
                          }}
                        >
                          <span className="ig-sel-atas">
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: warna, flexShrink: 0 }} />
                            <span className="ig-sel-tanggal">{i + 1}</span>
                          </span>
                          <span className="ig-sel-judul" style={{ fontSize: 10.5 }}>
                            {/* Pillar yang sudah dihapus tetap ditampilkan,
                                ditandai, bukan disembunyikan — kalau hilang
                                diam-diam, pola jadi lebih pendek tanpa
                                penjelasan saat ditanam. */}
                            {p ? p.name : 'Pillar terhapus'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); hapusDariPola(i) }}
                            aria-label="Hapus dari pola"
                            style={{
                              position: 'absolute', top: 4, right: 4, border: 'none',
                              background: 'transparent', cursor: 'pointer', padding: 2,
                              lineHeight: 1, color: 'var(--text-muted)',
                            }}
                          >
                            <Icon name="close-outline" size={13} />
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button type="button" className="btn btn-sm btn-ghost"
                      onClick={() => { setPola([]); setDipilih(null) }}>
                      Kosongkan pola
                    </button>
                    {aktif && (
                      <button type="button" className="btn btn-sm btn-ghost" onClick={batalkanTanam}
                        style={{ marginLeft: 'auto', color: 'var(--danger)' }}>
                        Hapus slot dari strategi ini
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ---------- Focus notes ---------- */}
          <div className="card" style={{ marginTop: 14 }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>Catatan minggu ini</p>
            <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Tiga pertanyaan yang bikin keputusan bulan depan tidak diambil
              dari ingatan. Berlaku untuk minggu yang dimulai {mingguIni}.
            </p>

            <label className="field-label" htmlFor="fn-goal">Target minggu ini</label>
            <textarea id="fn-goal" className="textarea" rows={2} value={catatan.goal}
              onChange={(e) => setCatatan((c) => ({ ...c, goal: e.target.value }))}
              placeholder="Satu hal yang ingin dicapai, sespesifik mungkin."
              style={{ marginBottom: 12, minHeight: 56 }} />

            <label className="field-label" htmlFor="fn-test">Yang sedang diuji</label>
            <textarea id="fn-test" className="textarea" rows={2} value={catatan.testing}
              onChange={(e) => setCatatan((c) => ({ ...c, testing: e.target.value }))}
              placeholder="Format baru, jam tayang baru, gaya caption berbeda."
              style={{ marginBottom: 12, minHeight: 56 }} />

            <label className="field-label" htmlFor="fn-works">Yang ternyata berhasil</label>
            <textarea id="fn-works" className="textarea" rows={2} value={catatan.works_well}
              onChange={(e) => setCatatan((c) => ({ ...c, works_well: e.target.value }))}
              placeholder="Apa yang responsnya bagus, dan dugaanmu kenapa."
              style={{ minHeight: 56 }} />

            <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}
              onClick={simpanCatatanMingguan} disabled={simpanCatatan}>
              {simpanCatatan ? 'Menyimpan...' : 'Simpan catatan'}
            </button>
          </div>
        </>
      )}

      {formTemplate && (
        <Sheet
          open
          onClose={() => setFormTemplate(false)}
          title="Mulai dari template"
          description="Pola siap pakai. Pillar yang belum ada di workspace-mu akan dibuatkan otomatis."
          lebar={420}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TEMPLATE_POLA.map((tpl) => (
              <button
                key={tpl.key}
                type="button"
                className="card"
                onClick={() => pakaiTemplate(tpl)}
                disabled={menerapkanTemplate !== null}
                style={{ textAlign: 'left', cursor: 'pointer', border: '0.5px solid var(--border)' }}
              >
                <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>
                  {menerapkanTemplate === tpl.key ? 'Menerapkan...' : tpl.nama}
                </p>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 9 }}>
                  {tpl.deskripsi}
                </p>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {tpl.urutan.map((n, i) => (
                    <span key={i} className="chip" style={{ fontSize: 10.5 }}>{n}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {formTanam && (
        <Sheet
          open
          onClose={() => setFormTanam(false)}
          title="Tanam ke jadwal"
          description={`${pola.length} slot akan dibuat di kalender ${getPlatform(platform).label}.`}
          lebar={400}
        >
          <form onSubmit={tanam}>
            <label className="field-label" htmlFor="tn-mulai">Mulai tanggal</label>
            <input id="tn-mulai" className="input" type="date" value={mulai}
              onChange={(e) => setMulai(e.target.value)} style={{ marginBottom: 12 }} />

            <label className="field-label" htmlFor="tn-jarak">Jarak antar konten</label>
            <select id="tn-jarak" className="select" value={jarak}
              onChange={(e) => setJarak(e.target.value)} style={{ marginBottom: 12 }}>
              <option value={1}>Setiap hari</option>
              <option value={2}>Dua hari sekali</option>
              <option value={3}>Tiga hari sekali</option>
              <option value={7}>Seminggu sekali</option>
            </select>

            <label className="field-label" htmlFor="tn-jam">Jam tayang (opsional)</label>
            <input id="tn-jam" className="input" type="time" value={jamTanam}
              onChange={(e) => setJamTanam(e.target.value)} />
            <p className="field-hint">
              Diisi kalau kamu ingin slot ini ikut mengirim pengingat nanti.
              Tanpa jam, pengingat tidak bisa dikirim.
            </p>

            <div className="sheet-aksi">
              <button type="button" className="btn" onClick={() => setFormTanam(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={sibuk}>
                {sibuk ? 'Menanam...' : `Tanam ${pola.length} slot`}
              </button>
            </div>
          </form>
        </Sheet>
      )}

      {tanya.dialog}
    </AppShell>
  )
}
