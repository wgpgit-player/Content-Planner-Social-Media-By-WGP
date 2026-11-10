import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sheet from './Sheet'
import Icon from './Icon'
import { PLATFORMS, getPlatform } from '../config/platforms'
import { supabase } from '../lib/supabaseClient'
import { useTenantContext } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { useTenantMembers, namaAnggota } from '../lib/useTenantMembers'
import { todayIso, addDays, isoDate } from '../lib/dates'

// Modal Pembuatan Mandat Brief & Jobdesk Konten Tim.
//
// Dirancang agar Manajer Sosmed / Lead Kreatif bisa cepat membuat mandat tugas:
// 1. Menentukan saluran (platform) & format konten.
// 2. Menulis judul & topik konten.
// 3. Merumuskan wording yang harus ada di dalam desain grafis / naskah video.
// 4. Menyematkan tautan referensi konten (Instagram, TikTok, Canva, Drive).
// 5. Memberi instruksi / mandat brief pokok.
// 6. Menugaskan langsung ke karyawan (PIC) dan menentukan target tanggal.
//
// PENTING: Pada tahap brief ini, pengguna TIDAK dituntut mengunggah gambar/foto hasil,
// karena pembuatan materi visual adalah tugas pelaksana di Lembar Kerja Tugas (Worksheet).

const FORMATS = [
  { key: 'carousel', label: 'Carousel (Slide)', icon: 'copy-outline' },
  { key: 'reels', label: 'Video (Reels/TikTok)', icon: 'videocam-outline' },
  { key: 'single', label: 'Single Post / Banner', icon: 'image-outline' },
  { key: 'story', label: 'Story Interaktif', icon: 'flash-outline' },
  { key: 'article', label: 'Artikel & Rilis Berita', icon: 'newspaper-outline' },
]

const TEMPLATE_WORDING = {
  carousel: `[Slide 1 - Hook Visual]: 3 Hal yang Sering Disalahpahami Tentang Sedekah Subuh
[Slide 2 - Masalah]: Merasa sedekah harus tunggu uang banyak terkumpul?
[Slide 3 - Insight/Fakta]: Padahal keberkahan terletak pada keistiqomahan, bukan semata nominal.
[Slide 4 - Solusi/Tips]: Mulai dari Rp 2.000 setiap selesai subuh secara rutin.
[Slide 5 - CTA Akhir]: Simpan postingan ini & salurkan sedekah subuhmu lewat QRIS CTARSA.`,
  reels: `[00:00 - 00:03 Hook]: "Jangan sedekah subuh kalau kamu belum tahu rahasia ini..."
[00:03 - 00:20 Pembahasan]: Tunjukkan rekaman relawan menyalurkan makanan ke pelosok sambil jelaskan dampaknya.
[00:20 - 00:30 Call to Action]: "Salurkan kepedulianmu sekarang bareng ZISWAF CTARSA. Klik tautan di bio!"`,
  single: `[Headline Utama]: Mengalirkan Asa, Memutus Rantai Kemiskinan
[Sub-headline]: Satu aksi kecil dari kita hadirkan senyum abadi bagi mereka yang membutuhkan.
[Poin Pesan]: ZISWAF CTARSA telah mendampingi ribuan keluarga melalui pendidikan dan kesehatan gratis.
[Elemen Brand]: Logo CTARSA di pojok kanan atas, QRIS resmi di pojok bawah.`,
  story: `[Frame 1]: Polling interaktif: "Sudahkah kamu sedekah hari ini? [Sudah] [Belum]"
[Frame 2]: Pengingat keutamaan sedekah di waktu subuh.
[Frame 3]: Stiker tautan langsung ke donasi online ctarsa.or.id`,
  article: `[Headline]: ZISWAF CTARSA Salurkan Bantuan Air Bersih di Sukabumi
[Dateline]: JAKARTA, ${todayIso()}
[Lead 5W+1H]: Ringkasan peristiwa, lokasi acara, jumlah penerima manfaat, dan mitra pelaksana.
[Kutipan Resmi]: "Program ini adalah wujud nyata kepedulian bersama donatur..." ujar Direktur ZISWAF CTARSA.
[Boilerplate & Web]: Informasi lengkap di https://ctarsa.or.id`,
}

export default function CreatePostModal({ open, onClose }) {
  const navigate = useNavigate()
  const { tenantId } = useTenantContext()
  const { user } = useAuth()
  const { members } = useTenantMembers()

  const [platform, setPlatform] = useState('instagram')
  const [format, setFormat] = useState('carousel')
  const [title, setTitle] = useState('')
  const [wording, setWording] = useState('')
  const [referensi, setReferensi] = useState('')
  const [brief, setBrief] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [pillarId, setPillarId] = useState('')
  const [tanggal, setTanggal] = useState(() => isoDate(addDays(new Date(), 1)))
  const [jam, setJam] = useState('16:00')

  const [pillars, setPillars] = useState([])
  const [saving, setSaving] = useState(false)
  const [pesan, setPesan] = useState(null)
  const [berhasil, setBerhasil] = useState(null)

  // Ambil pilar konten workspace aktif
  useEffect(() => {
    if (!supabase || !tenantId) return
    let batal = false
    supabase
      .from('content_pillars')
      .select('id, name, color')
      .eq('tenant_id', tenantId)
      .order('name')
      .then(({ data }) => {
        if (!batal && data) setPillars(data)
      })
    return () => {
      batal = true
    }
  }, [tenantId])

  // Reset pesan saat modal dibuka
  useEffect(() => {
    if (open) {
      setPesan(null)
      setBerhasil(null)
    }
  }, [open])

  function gantiPlatform(key) {
    setPlatform(key)
    if (key === 'article') {
      setFormat('article')
    } else if (key === 'tiktok') {
      setFormat('reels')
    }
  }

  function terapkanTemplateWording(kunciFormat) {
    const teks = TEMPLATE_WORDING[kunciFormat]
    if (teks) {
      setWording(teks)
      setFormat(kunciFormat)
    }
  }

  async function handleSimpan(lanjutKeWorksheet = false) {
    if (!title.trim()) {
      setPesan({ tipe: 'error', teks: 'Judul konten / topik jobdesk wajib diisi!' })
      return
    }
    if (!tenantId || !supabase) {
      setPesan({ tipe: 'error', teks: 'Ruang kerja belum siap. Silakan refresh halaman.' })
      return
    }

    setSaving(true)
    setPesan(null)

    try {
      const payload = {
        tenant_id: tenantId,
        platform,
        title: title.trim(),
        brief: brief.trim() || null,
        production_notes: wording.trim() || null,
        reference_url: referensi.trim() || null,
        assignee_id: assigneeId || null,
        pillar_id: pillarId || null,
        scheduled_date: tanggal || null,
        scheduled_time: jam || null,
        status: 'draft',
        created_by: user?.id ?? null,
      }

      const { data, error } = await supabase
        .from('content_items')
        .insert([payload])
        .select()
        .single()

      if (error) throw error

      // Sisipkan checklist SOP standar ke database
      try {
        const checklistBaris = [
          { content_item_id: data.id, tenant_id: tenantId, label: 'Pelajari brief & riset referensi manajer', position: 1 },
          { content_item_id: data.id, tenant_id: tenantId, label: 'Buat desain visual / edit naskah video', position: 2 },
          { content_item_id: data.id, tenant_id: tenantId, label: 'Tulis draf caption, CTA, & hashtag', position: 3 },
          { content_item_id: data.id, tenant_id: tenantId, label: 'Quality check mandiri (cek typo & estetika visual)', position: 4 },
          { content_item_id: data.id, tenant_id: tenantId, label: 'Ajukan review ke Manajer Sosmed', position: 5 },
        ]
        await supabase.from('checklist_items').insert(checklistBaris)
      } catch (e) {
        // Abaikan jika tabel checklist tidak ada
      }

      if (lanjutKeWorksheet) {
        onClose?.()
        navigate(`/worksheet?id=${data.id}`)
      } else {
        setBerhasil(data)
      }
    } catch (err) {
      setPesan({ tipe: 'error', teks: err.message || 'Gagal menyimpan brief konten.' })
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setTitle('')
    setWording('')
    setReferensi('')
    setBrief('')
    setBerhasil(null)
    setPesan(null)
  }

  const pAktif = getPlatform(platform)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Buat Mandat Brief & Jobdesk Tim"
      description="Rumuskan arahan kerja, wording naskah, dan tautan referensi untuk dieksekusi tim tanpa perlu mengunggah gambar jadi."
      lebar={640}
    >
      {berhasil ? (
        <div style={{ textAlign: 'center', padding: '24px 12px' }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#059669',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Icon name="checkmark-circle" size={36} color="#059669" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 750, margin: '0 0 8px', color: 'var(--text-primary)' }}>
            Brief Konten Berhasil Dimandatkan!
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.6 }}>
            Tugas <strong>"{berhasil.title}"</strong> untuk saluran <strong>{pAktif.label}</strong> telah tercatat di antrean produksi. Penanggung jawab dapat langsung mengeksekusi di Lembar Kerja Tugas.
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
            >
              <Icon name="add-circle-outline" size={15} />
              + Buat Brief Baru Lainnya
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose?.()
                navigate(`/worksheet?id=${berhasil.id}`)
              }}
            >
              <Icon name="reader-outline" size={15} />
              Buka di Lembar Kerja Tugas ↗
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSimpan(false)
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {pesan && (
            <div className={`alert alert-${pesan.tipe === 'error' ? 'error' : 'success'}`} style={{ margin: 0 }}>
              {pesan.teks}
            </div>
          )}

          {/* 1. Pemilih Platform */}
          <div>
            <label className="field-label" style={{ marginBottom: 6 }}>
              Pilih Saluran / Platform Konten
            </label>
            <div
              style={{
                display: 'flex',
                gap: 6,
                overflowX: 'auto',
                paddingBottom: 4,
                scrollbarWidth: 'thin',
              }}
            >
              {PLATFORMS.map((p) => {
                const aktif = platform === p.key
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => gantiPlatform(p.key)}
                    className="chip"
                    style={{
                      background: aktif ? p.bg : 'var(--surface-1)',
                      borderColor: aktif ? p.color : 'transparent',
                      color: aktif ? p.color : 'var(--text-secondary)',
                      fontWeight: aktif ? 700 : 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 11px',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={p.icon} size={15} color={aktif ? p.color : undefined} />
                    <span>{p.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Judul Konten & Penanggung Jawab */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
            <div>
              <label className="field-label">
                Judul Konten / Topik Jobdesk <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                className="input"
                required
                placeholder={
                  platform === 'article'
                    ? 'Contoh: ZISWAF CTARSA Salurkan Bantuan Air Bersih di Sukabumi'
                    : 'Contoh: Reels: 3 Tips Sedekah Subuh Berkah'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ fontWeight: 600 }}
              />
            </div>

            <div>
              <label className="field-label">Penanggung Jawab (PIC Tim)</label>
              <select
                className="select"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Pilih Anggota Tim...</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {namaAnggota(m)} {m.role === 'admin' ? '(Admin)' : '(Staff)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Wording di Dalam Konten (Teks Visual & Script Video) */}
          <div style={{ background: '#faf8fe', border: '1.5px solid #e5daf5', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
              <label className="field-label" style={{ margin: 0, color: '#5935d5', fontWeight: 700 }}>
                <Icon name="document-text-outline" size={14} style={{ marginRight: 4 }} />
                Wording di Dalam Konten (Teks Visual / Slide / Storyboard)
              </label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {FORMATS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => terapkanTemplateWording(f.key)}
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      background: format === f.key ? '#5935d5' : '#fff',
                      color: format === f.key ? '#fff' : '#5935d5',
                      border: '1px solid #d5c3f0',
                      borderRadius: 6,
                      padding: '2px 7px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    title={`Terapkan format teks ${f.label}`}
                  >
                    <Icon name={f.icon} size={11} />
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className="textarea"
              rows={5}
              placeholder="Tulis wording teks yang WAJIB dicantumkan desainer pada visual grafis atau naskah yang dibacakan di video..."
              value={wording}
              onChange={(e) => setWording(e.target.value)}
              style={{ fontSize: 12.5, lineHeight: 1.5, background: '#fff' }}
            />
            <p className="field-hint" style={{ marginTop: 4, color: '#736280' }}>
              Bisa langsung klik salah satu tombol format di atas (Carousel, Video, Banner) untuk menyisipkan struktur teks baku.
            </p>
          </div>

          {/* 4. Tautan Referensi Konten / Moodboard */}
          <div>
            <label className="field-label">
              <Icon name="link-outline" size={13} style={{ marginRight: 4 }} />
              Tautan Referensi Konten / Bahan Acuan
            </label>
            <input
              className="input"
              type="url"
              placeholder="https://instagram.com/reel/... atau https://tiktok.com/@... atau link Canva / Google Drive"
              value={referensi}
              onChange={(e) => setReferensi(e.target.value)}
            />
            <p className="field-hint" style={{ marginTop: 4 }}>
              Link contoh video viral, acuan gaya desain, atau materi dari manajer agar tim punya gambaran visual yang jelas.
            </p>
          </div>

          {/* 5. Mandat & Arahan Pokok Manajer */}
          <div>
            <label className="field-label">
              <Icon name="clipboard-outline" size={13} style={{ marginRight: 4 }} />
              Mandat & Arahan Pokok Manajer (Brief Directive)
            </label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="Contoh: Fokus pada hook emosional di 3 detik pertama, tonjolkan kemudahan donasi lewat QRIS, dan hindari warna gelap."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              style={{ fontSize: 12.5 }}
            />
          </div>

          {/* 6. Target Tanggal & Content Pillar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label className="field-label">Target Tanggal Tayang</label>
              <input
                className="input"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">Jam Tayang (WIB)</label>
              <input
                className="input"
                type="time"
                value={jam}
                onChange={(e) => setJam(e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">Content Pillar</label>
              <select
                className="select"
                value={pillarId}
                onChange={(e) => setPillarId(e.target.value)}
              >
                <option value="">Strategi / Pilar...</option>
                {pillars.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notice Edukatif Menjawab Keresahan User */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 9,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '10px 12px',
              borderRadius: 10,
              fontSize: 12,
              color: '#166534',
              lineHeight: 1.5,
            }}
          >
            <Icon name="information-circle-outline" size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Gambar / video hasil TIDAK perlu diunggah sekarang.</strong>
              <p style={{ margin: '2px 0 0', opacity: 0.9 }}>
                Setelah brief ini disimpan, karyawan/desainer akan langsung menerima mandat tugas dan mengunggah aset jadinya di <strong>Lembar Kerja Tugas (Worksheet)</strong>.
              </p>
            </div>
          </div>

          {/* Tombol Aksi Bawah */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleSimpan(true)}
              disabled={saving}
              title="Simpan brief dan langsung buka lembar kerja eksekusinya"
            >
              <Icon name="open-outline" size={14} />
              Simpan & Buka Lembar Kerja
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving}
              style={{ fontWeight: 700 }}
            >
              <Icon name="paper-plane-outline" size={14} />
              {saving ? 'Menyimpan...' : 'Kirim Mandat ke Tim'}
            </button>
          </div>
        </form>
      )}
    </Sheet>
  )
}
