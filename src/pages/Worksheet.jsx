import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import AppShell from '../components/AppShell'
import Icon from '../components/Icon'
import Sheet from '../components/Sheet'
import ChecklistTugas from '../components/ChecklistTugas'
import Komentar from '../components/Komentar'
import LampiranMateri from '../components/LampiranMateri'
import SmartDispatchButton from '../components/SmartDispatchButton'
import { getPlatform } from '../config/platforms'
import { getStatus, STATUSES } from '../config/statuses'
import { parseIsoDate, todayIso } from '../lib/dates'

const PRESET_HOOKS = [
  { kategori: 'Tanya & Penasaran', teks: 'Banyak yang belum tahu, ternyata ini rahasia di balik...' },
  { kategori: 'Tanya & Penasaran', teks: 'Kamu tahu nggak kenapa hal ini sering diabaikan orang?' },
  { kategori: 'Edukasi & Fakta', teks: '3 hal penting yang wajib kamu perhatikan sebelum mulai...' },
  { kategori: 'Edukasi & Fakta', teks: 'Fakta mengejutkan: 8 dari 10 orang belum sadar tentang ini!' },
  { kategori: 'Kebaikan & ZISWAF', teks: 'Sedekah subuh bukan sekadar angka, tapi tentang kebiasaan hati...' },
  { kategori: 'Kebaikan & ZISWAF', teks: 'Jangan tunggu berlebih baru berbagi, keberkahan hadir saat kita peduli.' },
  { kategori: 'Cerita & Humanis', teks: 'Satu momen kecil yang membuat kami tersadar indahnya berbagi...' },
]

const PRESET_CTAS = [
  { kategori: 'Interaksi & Komen', teks: 'Ketik "MAU" di kolom komentar, nanti mimin kirimkan panduannya ya!' },
  { kategori: 'Interaksi & Komen', teks: 'Menurut kamu poin berapa yang paling berkesan? Tulis di kolom komentar!' },
  { kategori: 'Save & Share', teks: 'Simpan (save) postingan ini agar tidak lupa saat kamu membutuhkannya nanti.' },
  { kategori: 'Save & Share', teks: 'Bagikan postingan ini ke teman atau keluargamu yang butuh pengingat ini.' },
  { kategori: 'Donasi & Link', teks: 'Klik tautan di bio untuk salurkan donasi terbaikmu bersama ZISWAF CTARSA.' },
  { kategori: 'Donasi & Link', teks: 'Scan kode QRIS CTARSA di slide terakhir untuk sedekah mudah hari ini.' },
]

const PRESET_HASHTAGS = [
  { nama: 'ZISWAF & Kemanusiaan', tags: '#ZISWAFCTARSA #BerbagiKebaikan #SedekahSubuh #ZakatBerkah #DonasiOnline' },
  { nama: 'Edukasi & Inspirasi', tags: '#InspirasiKebaikan #PeduliSesama #GenerasiPeduli #PendidikanUntukSemua' },
  { nama: 'Komunitas & Relawan', tags: '#AksiSosial #RelawanIndonesia #TanganKebaikan #CTARSABersama' },
  { nama: 'Kreator & Viral', tags: '#ContentCreator #ViralIndonesia #EdukasiBermanfaat #FYPIndonesia' },
]

const PRESET_ARTICLE_TEMPLATES = [
  {
    judul: 'Format Siaran Pers Resmi (Press Release Standar)',
    kategori: 'Siaran Pers',
    teks: `[KOTA], [TANGGAL] — Lembaga ZISWAF CTARSA hari ini secara resmi menyelenggarakan...

[LEAD 5W+1H]: Inisiatif ini dirancang guna memfasilitasi kebutuhan mendesak masyarakat pra-sejahtera melalui rangkaian program edukasi dan bantuan langsung. Kegiatan berlangsung dengan tertib serta dihadiri oleh jajaran relawan dan pimpinan wilayah setempat.

"[Kutipan resmi dari Pimpinan/Direktur terkait tujuan strategis dan komitmen keberlanjutan program]," ujar perwakilan manajemen ZISWAF CTARSA.

Melalui sinergi bersama para donatur dan mitra kebaikan, bantuan telah tersalurkan secara tepat sasaran kepada para mustahik. Seluruh laporan penyaluran akan dipublikasikan secara transparan.

Tentang ZISWAF CTARSA:
Lembaga amil zakat, infak, sedekah, dan wakaf yang berdedikasi memutus rantai kemiskinan melalui pilar pendidikan, kesehatan, dan pemberdayaan ekonomi umat. Informasi lebih lanjut: https://ctarsa.or.id`,
  },
  {
    judul: 'Format Artikel Cerita Dampak (Human Interest & Lapangan)',
    kategori: 'Artikel Web',
    teks: `[JUDUL EMOSIONAL: Membawa Senyum dan Asa Baru di...]

Di balik senyum hangat [Nama Penerima Manfaat/Keluarga], tersimpan perjuangan panjang menghadapi keterbatasan. Hari ini, suasana di [Lokasi Penyaluran] terasa berbeda saat tim relawan ZISWAF CTARSA menyambangi kediaman mereka.

Program ini membuktikan bahwa uluran tangan kecil dari kita mampu mengubah jalan hidup satu keluarga menuju masa depan yang lebih bermartabat.

"[Kutipan ungkapan rasa syukur dan harapan dari penerima manfaat]," tuturnya dengan penuh haru.

Mari terus alirkan kebaikan dan jaga asa mereka. Setiap sedekah dan zakat yang Anda titipkan melalui ZISWAF CTARSA menjadi lentera bagi mereka yang membutuhkan. Kunjungi https://ctarsa.or.id untuk menyalurkan kepedulian Anda.`,
  },
]

// Sub Worksheet Karyawan — lembar kerja eksekusi tugas dari Manajer Sosmed.
//
// Dirancang khusus untuk content creator, copywriter, dan desainer.
// Membantu karyawan fokus menyelesaikan mandat dari manajer:
// 1. Membaca brief dan arahan pokok dari manajer sosmed.
// 2. Mengerjakan checklist SOP eksekusi secara runut.
// 3. Menyusun hook, naskah caption, CTA, hashtag, serta link aset.
// 4. Mengajukan hasil draf ke manajer untuk direview dan di-ACC.

function formatTanggal(iso) {
  if (!iso) return 'Tanpa tenggat'
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const d = parseIsoDate(iso)
  return `${d.getDate()} ${BULAN[d.getMonth()]}`
}

export default function Worksheet() {
  const { user } = useAuth()
  const { tenantId, isAdmin } = useTenantContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const [tugasList, setTugasList] = useState([])
  const [tugasAktifId, setTugasAktifId] = useState(searchParams.get('id') || null)
  const [tugasAktif, setTugasAktif] = useState(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [filterTab, setFilterTab] = useState('semua') // 'semua' | 'draft' | 'review' | 'selesai'
  const [saving, setSaving] = useState(false)
  const [pesan, setPesan] = useState(null)

  // Form eksekusi draf karyawan
  const [draf, setDraf] = useState({
    caption: '',
    cta: '',
    hashtags: '',
    reference_url: '',
    status: 'draft',
  })
  const [modalBantu, setModalBantu] = useState(null) // null | 'hook' | 'cta' | 'hashtag'

  function sisipkanHook(teks) {
    setDraf((d) => ({
      ...d,
      caption: d.caption ? `${teks}\n\n${d.caption}` : `${teks}\n\n`,
    }))
    setModalBantu(null)
    setPesan('Hook berhasil disisipkan ke naskah! ✓')
  }

  function sisipkanCta(teks) {
    setDraf((d) => ({
      ...d,
      cta: teks,
    }))
    setModalBantu(null)
    setPesan('CTA berhasil disisipkan! ✓')
  }

  function sisipkanHashtag(tags) {
    setDraf((d) => ({
      ...d,
      hashtags: d.hashtags ? `${d.hashtags} ${tags}` : tags,
    }))
    setModalBantu(null)
    setPesan('Set hashtag berhasil disisipkan! ✓')
  }

  function sisipkanTemplateArtikel(teks, ctaOtomatis = 'Baca artikel lengkap di https://ctarsa.or.id') {
    setDraf((d) => ({
      ...d,
      caption: teks,
      cta: d.cta || ctaOtomatis,
    }))
    setModalBantu(null)
    setPesan('Format standar rilis berita / artikel berhasil disisipkan! ✓')
  }

  // 1. Muat daftar tugas yang ditugaskan ke karyawan (atau semua untuk admin)
  const muatDaftar = useCallback(async () => {
    if (!supabase || !tenantId || !user) return
    setLoadingList(true)

    let query = supabase
      .from('content_items')
      .select('id,title,platform,status,scheduled_date,scheduled_time,brief,objective,target_audience,key_message,production_notes,assignee_id')
      .eq('tenant_id', tenantId)
      .order('scheduled_date', { ascending: true, nullsFirst: false })
      .limit(100)

    // Jika bukan admin, utamakan tugas milik user yang sedang login
    if (!isAdmin) {
      query = query.eq('assignee_id', user.id)
    }

    const { data, error } = await query
    if (!error && data) {
      setTugasList(data)
      // Jika belum ada tugas terpilih, pilih yang pertama
      if (!tugasAktifId && data.length > 0) {
        setTugasAktifId(data[0].id)
      }
    }
    setLoadingList(false)
  }, [tenantId, user, isAdmin, tugasAktifId])

  useEffect(() => {
    muatDaftar()
  }, [muatDaftar])

  // 2. Muat detail konten tugas yang sedang aktif
  const muatDetailTugas = useCallback(async (id) => {
    if (!supabase || !tenantId || !id) return
    setLoadingDetail(true)
    setPesan(null)

    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (!error && data) {
      setTugasAktif(data)
      setDraf({
        caption: data.caption ?? '',
        cta: data.cta ?? '',
        hashtags: data.hashtags ?? '',
        reference_url: data.reference_url ?? '',
        status: data.status ?? 'draft',
      })
    }
    setLoadingDetail(false)
  }, [tenantId])

  useEffect(() => {
    if (tugasAktifId) {
      muatDetailTugas(tugasAktifId)
    }
  }, [tugasAktifId, muatDetailTugas])

  function pilihTugas(id) {
    setTugasAktifId(id)
    setSearchParams({ id })
  }

  // 3. Simpan hasil eksekusi draf karyawan
  async function simpanDraf(statusKustom = null) {
    if (!tugasAktif || !supabase || !tenantId) return
    setSaving(true)
    setPesan(null)

    const statusFinal = statusKustom || draf.status
    const payload = {
      caption: draf.caption.trim() || null,
      cta: draf.cta.trim() || null,
      hashtags: draf.hashtags.trim() || null,
      reference_url: draf.reference_url.trim() || null,
      status: statusFinal,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('content_items')
      .update(payload)
      .eq('id', tugasAktif.id)
      .eq('tenant_id', tenantId)

    setSaving(false)
    if (error) {
      setPesan({ tipe: 'error', teks: error.message })
    } else {
      setPesan({
        tipe: 'success',
        teks: statusKustom === 'review'
          ? 'Tugas berhasil diajukan ke Manajer Sosmed untuk direview!'
          : 'Draf pengerjaan berhasil disimpan.',
      })
      // Perbarui state lokal & daftar
      setTugasAktif((prev) => ({ ...prev, ...payload }))
      setDraf((prev) => ({ ...prev, status: statusFinal }))
      setTugasList((prev) => prev.map((t) => (t.id === tugasAktif.id ? { ...t, status: statusFinal } : t)))
    }
  }

  // Filter tugas menurut tab
  const tugasTerfilter = tugasList.filter((t) => {
    if (filterTab === 'draft') return ['idea', 'draft'].includes(t.status)
    if (filterTab === 'review') return t.status === 'review'
    if (filterTab === 'selesai') return ['scheduled', 'published'].includes(t.status)
    return true
  })

  const platformAktif = tugasAktif ? getPlatform(tugasAktif.platform) : null
  const statusAktif = tugasAktif ? getStatus(tugasAktif.status) : null
  const hariIni = todayIso()
  const isTerlambat = tugasAktif?.scheduled_date && tugasAktif.scheduled_date < hariIni && tugasAktif.status !== 'published'

  return (
    <AppShell
      title="Lembar Kerja Tugas (Sub Worksheet)"
      description="Ruang kerja karyawan & tim kreatif untuk menyelesaikan mandat konten dari manajer sosmed."
      maxWidth={1400}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/kanban" className="btn btn-secondary btn-sm">
            <Icon name="albums-outline" size={14} /> Papan Kanban
          </Link>
          <Link to="/content-calendar" className="btn btn-secondary btn-sm">
            <Icon name="calendar-outline" size={14} /> Kalender
          </Link>
        </div>
      }
    >
      {pesan && (
        <div
          className={`alert alert-${pesan.tipe === 'error' ? 'error' : 'success'}`}
          style={{ marginBottom: 14 }}
        >
          {pesan.teks}
        </div>
      )}

      {/* Grid Worksheet: Kiri = Daftar Tugas dari Manajer, Kanan = Lembar Kerja Eksekusi */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 18, alignItems: 'start' }}>
        
        {/* Kolom Kiri: Daftar Tugas */}
        <div className="card" style={{ padding: '14px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="briefcase-outline" size={16} color="var(--accent)" />
              <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>
                {isAdmin ? 'Semua Tugas Tim' : 'Tugas Mandat Kamu'}
              </h3>
            </div>
            <span style={{ fontSize: 11, background: 'var(--surface-1)', padding: '2px 7px', borderRadius: 99, fontWeight: 600 }}>
              {tugasTerfilter.length}
            </span>
          </div>

          {/* Tab Filter */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: 'var(--surface-1)', padding: 3, borderRadius: 8 }}>
            {[
              { id: 'semua', label: 'Semua' },
              { id: 'draft', label: 'Draf' },
              { id: 'review', label: 'Review' },
              { id: 'selesai', label: 'ACC/Tayang' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '5px 4px',
                  fontSize: 11,
                  fontWeight: filterTab === tab.id ? 600 : 400,
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: filterTab === tab.id ? 'var(--surface-0, #fff)' : 'transparent',
                  color: filterTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: filterTab === tab.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List Kartu Tugas */}
          {loadingList ? (
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '12px 6px' }}>Memuat daftar tugas...</p>
          ) : tugasTerfilter.length === 0 ? (
            <div style={{ padding: '24px 8px', textAlign: 'center' }}>
              <Icon name="checkmark-done-circle-outline" size={32} color="var(--success)" />
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 8 }}>
                Tidak ada tugas di kategori ini.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              {tugasTerfilter.map((it) => {
                const p = getPlatform(it.platform)
                const s = getStatus(it.status)
                const aktif = it.id === tugasAktifId

                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => pilihTugas(it.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 9,
                      textAlign: 'left',
                      border: aktif ? '1.5px solid var(--accent)' : '1px solid var(--border-subtle, #f0f0f0)',
                      background: aktif ? 'var(--accent-bg, rgba(99,102,241,0.06))' : 'var(--surface-0, #fff)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        flexShrink: 0,
                        background: p.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 2,
                      }}
                    >
                      <Icon name={p.icon} size={15} color={p.color} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: aktif ? 600 : 500,
                          color: 'var(--text-primary)',
                          margin: '0 0 3px 0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {it.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {formatTanggal(it.scheduled_date)}
                        </span>
                        <span
                          style={{
                            fontSize: 10.5,
                            padding: '1px 6px',
                            borderRadius: 99,
                            background: s.bg,
                            color: s.color,
                            fontWeight: 600,
                          }}
                        >
                          {s.label}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Area Worksheet Eksekusi */}
        {loadingDetail ? (
          <div className="card" style={{ padding: 30, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Membuka lembar kerja tugas...</p>
          </div>
        ) : !tugasAktif ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <Icon name="document-text-outline" size={36} color="var(--text-muted)" />
            <p style={{ fontSize: 14, fontWeight: 600, marginTop: 10 }}>Pilih salah satu tugas dari daftar</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Klik tugas di sebelah kiri untuk mulai membaca brief manajer dan menulis draf konten.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Header Tugas */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className="chip" style={{ background: platformAktif.bg, color: platformAktif.color, borderColor: 'transparent' }}>
                      <Icon name={platformAktif.icon} size={13} /> {platformAktif.label}
                    </span>
                    <span className="chip" style={{ background: statusAktif.bg, color: statusAktif.color, borderColor: 'transparent' }}>
                      {statusAktif.label}
                    </span>
                    {isTerlambat && (
                      <span className="chip" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'transparent' }}>
                        <Icon name="alarm-outline" size={12} /> Terlambat
                      </span>
                    )}
                  </div>

                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px 0' }}>
                    {tugasAktif.title}
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    Target Tayang: <strong>{formatTanggal(tugasAktif.scheduled_date)}</strong>
                    {tugasAktif.scheduled_time ? ` pukul ${tugasAktif.scheduled_time.slice(0, 5)} WIB` : ''}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Link to={`/content/${tugasAktif.id}`} className="btn btn-secondary btn-sm" title="Buka Detail Brief Lengkap">
                    <Icon name="open-outline" size={14} /> Brief Penuh
                  </Link>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => simpanDraf()}
                    disabled={saving}
                  >
                    <Icon name="save-outline" size={14} /> {saving ? 'Menyimpan...' : 'Simpan Draf'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: 'var(--success, #10b981)', color: '#fff', border: 'none' }}
                    onClick={() => simpanDraf('review')}
                    disabled={saving}
                    title="Ajukan ke Manajer Sosmed untuk di-review"
                  >
                    <Icon name="paper-plane-outline" size={14} /> Ajukan Review
                  </button>

                  {/* Smart Dispatcher: 1-Klik Salin Naskah & Buka Studio Resmi */}
                  <SmartDispatchButton
                    item={{ ...tugasAktif, ...draf }}
                    targetUrl={draf.reference_url || tugasAktif.reference_url}
                    onStatusUpdated={(statusBaru) => {
                      setTugasAktif((prev) => ({ ...prev, status: statusBaru }))
                      setDraf((prev) => ({ ...prev, status: statusBaru }))
                      setTugasList((prev) => prev.map((t) => (t.id === tugasAktif.id ? { ...t, status: statusBaru } : t)))
                    }}
                  />
                </div>
              </div>
            </div>

            {/* SEKSI 1: Mandat & Arahan Pokok Manajer Sosmed */}
            <div className="card" style={{ borderLeft: '4px solid var(--accent, #6366f1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <Icon name="clipboard-outline" size={16} color="var(--accent)" />
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Arahan & Brief dari Manajer Sosmed</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div style={{ background: 'var(--surface-1, #f9fafb)', padding: '10px 12px', borderRadius: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Ringkasan Brief
                  </p>
                  <p style={{ fontSize: 12.5, margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                    {tugasAktif.brief || 'Belum ada ringkasan brief.'}
                  </p>
                </div>

                <div style={{ background: 'var(--surface-1, #f9fafb)', padding: '10px 12px', borderRadius: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Pesan Utama (Key Message)
                  </p>
                  <p style={{ fontSize: 12.5, margin: 0, color: 'var(--text-primary)' }}>
                    {tugasAktif.key_message || 'Belum ditentukan.'}
                  </p>
                </div>

                <div style={{ background: 'var(--surface-1, #f9fafb)', padding: '10px 12px', borderRadius: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Tujuan & Target Audiens
                  </p>
                  <p style={{ fontSize: 12.5, margin: 0, color: 'var(--text-primary)' }}>
                    {tugasAktif.objective || tugasAktif.target_audience
                      ? `${tugasAktif.objective ?? ''} ${tugasAktif.target_audience ? `· Target: ${tugasAktif.target_audience}` : ''}`
                      : 'Belum diisi.'}
                  </p>
                </div>

                {tugasAktif.production_notes && (
                  <div style={{ background: 'var(--surface-1, #f9fafb)', padding: '10px 12px', borderRadius: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                      Catatan Produksi Manajer
                    </p>
                    <p style={{ fontSize: 12.5, margin: 0, color: 'var(--text-primary)' }}>
                      {tugasAktif.production_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* SEKSI 2: Checklist Eksekusi Karyawan (SOP) */}
            <ChecklistTugas contentItemId={tugasAktif.id} />

            {/* SEKSI 3: Area Kerja Eksekusi Karyawan (Copywriting & Aset) */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <Icon name="create-outline" size={16} color="var(--accent)" />
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Eksekusi Naskah & Aset Karyawan</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Draf Caption / Naskah */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                    <label className="field-label" style={{ margin: 0 }}>
                      Draf Naskah / Caption Lengkap ({draf.caption.length} karakter)
                    </label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {tugasAktif?.platform === 'article' && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setModalBantu('article')}
                          style={{ fontSize: 11, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4, background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd' }}
                          title="Pilih template format siaran pers / artikel"
                        >
                          <Icon name="newspaper-outline" size={13} color="#0284c7" />
                          <span>Format Rilis Berita</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setModalBantu('hook')}
                        style={{ fontSize: 11, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4, background: '#f5efff', color: '#5935d5', border: '1px solid #dfcef5' }}
                        title="Pilih contoh kalimat pembuka (hook)"
                      >
                        <Icon name="fish-outline" size={13} color="#5935d5" />
                        <span>Sisipkan Hook</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setModalBantu('cta')}
                        style={{ fontSize: 11, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4, background: '#f5efff', color: '#5935d5', border: '1px solid #dfcef5' }}
                        title="Pilih contoh ajakan bertindak (CTA)"
                      >
                        <Icon name="megaphone-outline" size={13} color="#5935d5" />
                        <span>Sisipkan CTA</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setModalBantu('hashtag')}
                        style={{ fontSize: 11, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 4, background: '#f5efff', color: '#5935d5', border: '1px solid #dfcef5' }}
                        title="Pilih set hashtag siap pakai"
                      >
                        <Icon name="pricetags-outline" size={13} color="#5935d5" />
                        <span>Set Hashtag</span>
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="textarea"
                    rows={8}
                    placeholder={
                      tugasAktif?.platform === 'article'
                        ? 'Tulis teks siaran pers lengkap (Headline, Dateline, Paragraf Pembuka 5W+1H, Kutipan Narasumber, Rincian Bantuan, dan Boilerplate Tentang ZISWAF CTARSA)...'
                        : 'Tulis naskah video slide-by-slide atau caption postingan di sini...'
                    }
                    value={draf.caption}
                    onChange={(e) => setDraf((d) => ({ ...d, caption: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* Call to Action */}
                  <div>
                    <label className="field-label">Ajakan Bertindak (CTA)</label>
                    <input
                      className="input"
                      placeholder={tugasAktif?.platform === 'article' ? 'Baca selengkapnya di https://ctarsa.or.id/berita' : "Contoh: Komen 'ZAKAT' atau klik link di bio"}
                      value={draf.cta}
                      onChange={(e) => setDraf((d) => ({ ...d, cta: e.target.value }))}
                    />
                  </div>

                  {/* Hashtags */}
                  <div>
                    <label className="field-label">Hashtags (#)</label>
                    <input
                      className="input"
                      placeholder="#EdukasiZakat #CTARSA #BerbagiKebaikan"
                      value={draf.hashtags}
                      onChange={(e) => setDraf((d) => ({ ...d, hashtags: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Link Aset / Referensi Eksekusi */}
                <div>
                  <label className="field-label">
                    {tugasAktif?.platform === 'article'
                      ? 'Link Portal Publikasi Berita / Dokumentasi Foto (Web Portal, Drive)'
                      : 'Link Folder Aset / Desain (Google Drive, Figma, Canva)'}
                  </label>
                  <input
                    className="input"
                    type="url"
                    placeholder={tugasAktif?.platform === 'article' ? 'https://ctarsa.or.id/berita/... atau folder foto Google Drive' : 'https://drive.google.com/... atau https://canva.com/...'}
                    value={draf.reference_url}
                    onChange={(e) => setDraf((d) => ({ ...d, reference_url: e.target.value }))}
                  />
                </div>

                {/* Tombol Simpan & Serah Terima */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => simpanDraf()}
                    disabled={saving}
                  >
                    <Icon name="save-outline" size={14} /> Simpan Progres
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => simpanDraf('review')}
                    disabled={saving}
                    style={{ background: 'var(--success, #10b981)', borderColor: 'transparent' }}
                  >
                    <Icon name="checkmark-done-outline" size={14} /> Selesai & Serahkan ke Manajer (ACC)
                  </button>
                </div>
              </div>
            </div>

            {/* SEKSI 4: Lampiran File & Media Materi */}
            <LampiranMateri contentId={tugasAktif.id} />

            {/* SEKSI 5: Diskusi & Catatan Feedback Manajer */}
            <Komentar contentId={tugasAktif.id} />

          </div>
        )}
      </div>

      {/* Drawer Cepat Copywriting */}
      {modalBantu && (
        <Sheet
          open={Boolean(modalBantu)}
          onClose={() => setModalBantu(null)}
          title={
            modalBantu === 'article'
              ? 'Pilih Format Standar Siaran Pers / Artikel'
              : modalBantu === 'hook'
              ? 'Pilih Hook Pembuka'
              : modalBantu === 'cta'
              ? 'Pilih Ajakan Bertindak (CTA)'
              : 'Pilih Set Hashtag'
          }
          description={
            modalBantu === 'article'
              ? 'Pilih format di bawah untuk menerapkan struktur baku siaran pers (Headline, Dateline, 5W+1H, Kutipan Narasumber, Boilerplate).'
              : modalBantu === 'hook'
              ? 'Klik salah satu hook untuk menyisipkannya langsung ke awal naskah caption kamu.'
              : modalBantu === 'cta'
              ? 'Klik salah satu CTA untuk langsung mengisinya ke kolom Ajakan Bertindak.'
              : 'Klik set hashtag untuk menyisipkannya ke kolom hashtag.'
          }
          lebar={520}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '10px 0' }}>
            {modalBantu === 'article' &&
              PRESET_ARTICLE_TEMPLATES.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sisipkanTemplateArtikel(item.teks)}
                  className="card"
                  style={{
                    textAlign: 'left',
                    padding: '14px 16px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: 'var(--surface-0)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0284c7')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: '#0284c7',
                        background: '#e0f2fe',
                        padding: '2px 8px',
                        borderRadius: 99,
                      }}
                    >
                      {item.kategori}
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.judul}
                    </span>
                  </div>
                  <pre
                    style={{
                      fontSize: 11.5,
                      color: 'var(--text-secondary)',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5,
                      maxHeight: 110,
                      overflow: 'hidden',
                      fontFamily: 'inherit',
                      background: 'var(--surface-1, #f9fafb)',
                      padding: '8px 10px',
                      borderRadius: 8,
                    }}
                  >
                    {item.teks}
                  </pre>
                  <div style={{ marginTop: 8, textAlign: 'right', fontSize: 11, fontWeight: 650, color: '#0284c7' }}>
                    + Terapkan Format Ini ke Naskah
                  </div>
                </button>
              ))}

            {modalBantu === 'hook' &&
              PRESET_HOOKS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sisipkanHook(item.teks)}
                  className="card"
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: 'var(--surface-0)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 650,
                      color: 'var(--accent)',
                      background: 'var(--accent-bg)',
                      padding: '2px 8px',
                      borderRadius: 99,
                      display: 'inline-block',
                      marginBottom: 6,
                    }}
                  >
                    {item.kategori}
                  </span>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
                    "{item.teks}"
                  </p>
                </button>
              ))}

            {modalBantu === 'cta' &&
              PRESET_CTAS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sisipkanCta(item.teks)}
                  className="card"
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: 'var(--surface-0)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 650,
                      color: '#059669',
                      background: '#ecfdf5',
                      padding: '2px 8px',
                      borderRadius: 99,
                      display: 'inline-block',
                      marginBottom: 6,
                    }}
                  >
                    {item.kategori}
                  </span>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
                    "{item.teks}"
                  </p>
                </button>
              ))}

            {modalBantu === 'hashtag' &&
              PRESET_HASHTAGS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sisipkanHashtag(item.tags)}
                  className="card"
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: 'var(--surface-0)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    🏷️ {item.nama}
                  </span>
                  <p style={{ fontSize: 12, color: 'var(--accent)', margin: 0, lineHeight: 1.5 }}>
                    {item.tags}
                  </p>
                </button>
              ))}
          </div>
        </Sheet>
      )}
    </AppShell>
  )
}
