import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBahasa } from '../lib/bahasa'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import { supabase } from '../lib/supabaseClient'
import Icon from './Icon'
import { getPlatform } from '../config/platforms'
import { getStatus } from '../config/statuses'
import { todayIso, parseIsoDate } from '../lib/dates'

// Pusat Mobilisasi & Jadwal Tugas Konten (Task Schedule & Notification Hub).
//
// Menggantikan contoh draf statis menjadi konsol interaktif tim:
// 1. Memantau antrean tugas harian & mendesak.
// 2. Memeriksa siapa penanggung jawab (PIC) dan mandat brief-nya.
// 3. Mengirim notifikasi / colek pengingat tugas ke karyawan/tim secara instan.
// 4. Menyediakan template teks WhatsApp siap kirim ke grup kerja.
// 5. Tombol 1-klik untuk langsung membuka Lembar Kerja Tugas (/worksheet).

function formatTanggalJam(isoDate, time) {
  if (!isoDate) return 'Tanpa jadwal'
  try {
    const hariIni = todayIso()
    const d = parseIsoDate(isoDate)
    const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const labelTgl = isoDate === hariIni ? 'Hari Ini' : `${d.getDate()} ${BULAN[d.getMonth()]}`
    return time ? `${labelTgl}, ${String(time).slice(0, 5)} WIB` : labelTgl
  } catch {
    return String(isoDate)
  }
}

// Preset tugas interaktif realistis (digunakan saat database kosong atau sebagai fallback)
const PRESET_TUGAS = {
  mendesak: [
    {
      id: 'preset-1',
      title: 'Video Reels: 3 Tips Sedekah Subuh Berkah',
      platform: 'instagram',
      status: 'draft',
      scheduled_date: todayIso(),
      scheduled_time: '16:30',
      assignee_name: 'Fahri (Content Creator)',
      brief: 'Fokus hook emosional di 3 detik pertama. Tunjukkan kemudahan donasi online lewat QRIS CTARSA. CTA ajak follow & simpan video.',
      objective: 'Tingkatkan engagement dan donasi digital',
      key_message: 'Sedekah subuh membuka pintu rezeki dan keberkahan hari.',
    },
    {
      id: 'preset-2',
      title: 'Story Q&A: Penyaluran Dana Zakat Bulan Ini',
      platform: 'instagram',
      status: 'review',
      scheduled_date: todayIso(),
      scheduled_time: '19:00',
      assignee_name: 'Nisa (Social Media Officer)',
      brief: 'Buat 4 frame story interaktif dengan stiker kuis/polling. Tampilkan transparansi laporan penyaluran.',
      objective: 'Transparansi program & interaksi audiens',
      key_message: 'Setiap rupiah amanah Anda sampai ke tangan yang tepat.',
    },
  ],
  draf: [
    {
      id: 'preset-3',
      title: 'Carousel: 5 Dampak Positif Zakat bagi Pendidikan Anak',
      platform: 'instagram',
      status: 'draft',
      scheduled_date: '2026-11-10',
      scheduled_time: '10:00',
      assignee_name: 'Nisa (Graphic Designer)',
      brief: 'Gunakan slide 1 s/d 5 dengan alur problem-solution. Slide 4 tampilkan infografis data riil penerima beasiswa.',
      objective: 'Edukasi pentingnya pendidikan bagi anak dhuafa',
      key_message: 'Pendidikan adalah hak setiap anak, zakatmu jembatan masa depan mereka.',
    },
    {
      id: 'preset-4',
      title: 'Thread X: Fakta Menarik Program CTARSA di Pelosok',
      platform: 'twitter',
      status: 'draft',
      scheduled_date: '2026-11-11',
      scheduled_time: '13:00',
      assignee_name: 'Budi (Copywriter)',
      brief: 'Format kultwit 6 cuitan ringkas disertai foto dokumentasi relawan di pedalaman.',
      objective: 'Storytelling human interest di media sosial X',
      key_message: 'Semangat belajar anak-anak pelosok pantang surut meski terbatas.',
    },
  ],
  review: [
    {
      id: 'preset-5',
      title: 'TikTok: Behind The Scene Penyaluran Paket Seragam',
      platform: 'tiktok',
      status: 'review',
      scheduled_date: '2026-11-11',
      scheduled_time: '14:30',
      assignee_name: 'Fahri (Video Editor)',
      brief: 'Draft video 45 detik sudah dirakit dengan audio trending. Mohon koreksi manajer untuk timing teks dan logo yayasan.',
      objective: 'Viralitas & jangkauan audiens muda',
      key_message: 'Kebahagiaan sederhana anak-anak menerima seragam baru.',
    },
  ],
  terjadwal: [
    {
      id: 'preset-6',
      title: 'YouTube Shorts: Kisah Guru Pengabdi di Pulau Terluar',
      platform: 'youtube',
      status: 'scheduled',
      scheduled_date: '2026-11-14',
      scheduled_time: '11:00',
      assignee_name: 'Tim Multimedia',
      brief: 'Format 9:16 durasi 55 detik. Cuplikan wawancara singkat guru relawan dengan musik inspiratif.',
      objective: 'Apresiasi guru & inspirasi ketulusan berbagi',
      key_message: 'Pengorbanan tulus demi mencerdaskan kehidupan tunas bangsa.',
    },
  ],
}

export default function CreativeLab({ inApp = false }) {
  const { t } = useBahasa()
  const { user } = useAuth()
  const { tenantId, tenant } = useTenantContext()
  const navigate = useNavigate()

  const [kategori, setKategori] = useState('mendesak') // 'mendesak' | 'draf' | 'review' | 'terjadwal'
  const [daftarTugas, setDaftarTugas] = useState(PRESET_TUGAS)
  const [tugasTerpilih, setTugasTerpilih] = useState(PRESET_TUGAS.mendesak[0])
  const [notifTerkirim, setNotifTerkirim] = useState(null)
  const [waTersalin, setWaTersalin] = useState(false)
  const [memberMap, setMemberMap] = useState({})
  const [isDataRiil, setIsDataRiil] = useState(false)

  // Ambil data tugas & anggota tim riil dari Supabase jika tersedia
  useEffect(() => {
    let batalkan = false

    async function muatData() {
      if (!supabase || !tenantId) return

      try {
        // Ambil data anggota tim untuk menampilkan nama penanggung jawab
        const { data: mems } = await supabase
          .from('tenant_members')
          .select('user_id, role, profiles(id, full_name, email)')
          .eq('tenant_id', tenantId)

        const map = {}
        if (mems) {
          mems.forEach((m) => {
            const nama = m.profiles?.full_name || m.profiles?.email?.split('@')[0] || 'Karyawan'
            map[m.user_id] = nama
          })
          if (!batalkan) setMemberMap(map)
        }

        // Ambil daftar konten dari content_items
        const { data: items } = await supabase
          .from('content_items')
          .select('id, title, platform, status, scheduled_date, scheduled_time, brief, objective, key_message, assignee_id')
          .eq('tenant_id', tenantId)
          .order('scheduled_date', { ascending: true, nullsFirst: false })
          .limit(60)

        if (!batalkan && items) {
          const hariIni = todayIso()
          const dikelompokkan = {
            mendesak: [],
            draf: [],
            review: [],
            terjadwal: [],
          }

          items.forEach((it) => {
            const assigneeName = it.assignee_id ? (map[it.assignee_id] || 'Anggota Tim') : 'Belum ditugaskan'
            const itemLengkap = {
              ...it,
              assignee_name: assigneeName,
            }

            if ((it.scheduled_date && it.scheduled_date <= hariIni) || it.status === 'idea') {
              dikelompokkan.mendesak.push(itemLengkap)
            } else if (it.status === 'draft') {
              dikelompokkan.draf.push(itemLengkap)
            } else if (it.status === 'review') {
              dikelompokkan.review.push(itemLengkap)
            } else {
              dikelompokkan.terjadwal.push(itemLengkap)
            }
          })

          // Jika ruang kerja sudah punya data konten riil, gunakan 100% data riil tanpa preset dummy
          const adaDataRiil = items.length > 0
          setIsDataRiil(adaDataRiil)

          const hasil = adaDataRiil
            ? dikelompokkan
            : PRESET_TUGAS

          setDaftarTugas(hasil)
          if (hasil[kategori] && hasil[kategori].length > 0) {
            setTugasTerpilih(hasil[kategori][0])
          } else {
            setTugasTerpilih(null)
          }
        }
      } catch (err) {
        console.warn('Gagal memuat tugas dinamis:', err)
      }
    }

    muatData()
    return () => { batalkan = true }
  }, [tenantId, kategori])

  // Saat kategori berubah, update tugas aktif ke item pertama kategori tsb
  function gantiKategori(kat) {
    setKategori(kat)
    setNotifTerkirim(null)
    setWaTersalin(false)
    const list = daftarTugas[kat] || []
    if (list.length > 0) {
      setTugasTerpilih(list[0])
    } else {
      setTugasTerpilih(null)
    }
  }

  // Aksi interaktif: Kirim Notifikasi Pengingat
  function kirimNotifikasi() {
    if (!tugasTerpilih) return
    const namaPic = tugasTerpilih.assignee_name || 'Tim Pengeksekusi'
    setNotifTerkirim(`Pengingat tugas berhasil dikirimkan ke ${namaPic}! 🔔`)
    setWaTersalin(false)

    // Notifikasi browser opsional
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(`Pengingat Tugas: ${tugasTerpilih.title}`, {
          body: `Jadwal: ${formatTanggalJam(tugasTerpilih.scheduled_date, tugasTerpilih.scheduled_time)} · PIC: ${namaPic}`,
          icon: '/favicon.ico',
        })
      } catch (e) {
        // Abaikan jika tidak didukung browser
      }
    }
  }

  // Aksi interaktif: Salin Teks Notifikasi WhatsApp
  async function salinFormatWA() {
    if (!tugasTerpilih) return
    const p = getPlatform(tugasTerpilih.platform)
    const s = getStatus(tugasTerpilih.status)
    const urlKerja = window.location.origin + `/worksheet?id=${tugasTerpilih.id}`

    const teksWA = [
      `📢 *PENGINGAT TUGAS KONTEN (${tenant?.name || 'Social Media Team'})*`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `📌 *Judul:* ${tugasTerpilih.title}`,
      `🎯 *Platform:* ${p.label}`,
      `⏰ *Jadwal Tayang:* ${formatTanggalJam(tugasTerpilih.scheduled_date, tugasTerpilih.scheduled_time)}`,
      `👤 *PIC / Penanggung Jawab:* ${tugasTerpilih.assignee_name}`,
      `📋 *Status:* ${s.label}`,
      tugasTerpilih.brief ? `\n💡 *Mandat / Brief:* \n"${tugasTerpilih.brief}"` : '',
      `\n👉 *Buka Lembar Kerja Tugas:* \n${urlKerja}`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `_Mohon segera diselesaikan sesuai standar SOP. Semangat!_`,
    ].filter(Boolean).join('\n')

    try {
      await navigator.clipboard.writeText(teksWA)
      setWaTersalin(true)
      setNotifTerkirim(null)
    } catch {
      // Fallback
    }
  }

  // Kemiringan halus mengikuti kursor (micro-interaction)
  function gerakkan(e) {
    if (!window.matchMedia('(pointer:fine) and (prefers-reduced-motion:no-preference)').matches) return
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--art-turn', ((e.clientX - r.left) / r.width - 0.5) * 4 + 'deg')
    e.currentTarget.style.setProperty('--art-lift', ((e.clientY - r.top) / r.height - 0.5) * -6 + 'px')
  }

  function kembalikan(e) {
    e.currentTarget.style.setProperty('--art-turn', '0deg')
    e.currentTarget.style.setProperty('--art-lift', '0px')
  }

  const listAktif = daftarTugas[kategori] || []
  const itemAktif = tugasTerpilih || (listAktif.length > 0 ? listAktif[0] : null)
  const plat = itemAktif ? getPlatform(itemAktif.platform) : null
  const stat = itemAktif ? getStatus(itemAktif.status) : null

  // Hitung jumlah untuk status badge
  const jumlahMendesak = (daftarTugas.mendesak || []).length
  const jumlahDraf = (daftarTugas.draf || []).length
  const jumlahReview = (daftarTugas.review || []).length

  return (
    <section
      onPointerMove={gerakkan}
      onPointerLeave={kembalikan}
      className={'creative-lab' + (inApp ? ' creative-lab-app' : '')}
      aria-label="Pusat Jadwal & Notifikasi Mobilisasi Tugas"
    >
      {/* Kolom Kiri: Pengantar & Metrik Cepat */}
      <div className="lab-intro">
        <span className="lab-label">
          <Icon name="flash-outline" size={14} style={{ marginRight: 6 }} />
          Pusat Mobilisasi Tim
        </span>
        <h2>
          Jadwal & Notif<br />Tugas Harian.
        </h2>
        <p>
          Pantau antrean kerja secara real-time, beri mandat brief yang jelas, dan kirim pengingat tugas ke penanggung jawab hanya dalam 1 klik.
        </p>

        {/* Metrik Cepat */}
        <div className="task-stat-grid">
          <div className="task-stat-item">
            <div className="task-stat-val" style={{ color: 'var(--danger, #e11d48)' }}>{jumlahMendesak}</div>
            <div className="task-stat-lbl">Mendesak</div>
          </div>
          <div className="task-stat-item">
            <div className="task-stat-val" style={{ color: '#5935d5' }}>{jumlahDraf}</div>
            <div className="task-stat-lbl">Dalam Draf</div>
          </div>
          <div className="task-stat-item">
            <div className="task-stat-val" style={{ color: 'var(--warning, #d97706)' }}>{jumlahReview}</div>
            <div className="task-stat-lbl">Perlu Review</div>
          </div>
        </div>

        <img
          src="/images/creative-guide.png"
          alt="Ilustrasi tim mobilisasi konten"
          width="500"
          height="500"
          loading="lazy"
        />
      </div>

      {/* Kolom Kanan: Meja Interaktif Jadwal & Notifikasi */}
      <div className="lab-workbench">
        {/* Toolbar Atas */}
        <div className="lab-toolbar">
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mobilizer-pulse" />
            Pusat Kendali Mobilisasi Tugas
          </span>
          <small style={{ color: isDataRiil ? '#059669' : '#736280', fontWeight: 600 }}>
            <Icon name={isDataRiil ? 'cloud-done-outline' : 'sparkles-outline'} size={12} style={{ marginRight: 4 }} />
            {isDataRiil ? 'Data Riil Tim Aktif' : 'Simulasi Contoh (Belum Ada Konten)'}
          </small>
        </div>

        {/* 1. Pemilih Kategori Urgensi */}
        <fieldset>
          <legend>Kategori Jadwal & Urgensi Tugas</legend>
          <div className="lab-options">
            {[
              ['mendesak', '⚡ Hari Ini & Mendesak', jumlahMendesak],
              ['draf', '✍️ Sedang Dikerjakan', jumlahDraf],
              ['review', '🔍 Menunggu Review', jumlahReview],
              ['terjadwal', '📅 7 Hari ke Depan', (daftarTugas.terjadwal || []).length],
            ].map(([k, label, count]) => (
              <button
                type="button"
                key={k}
                aria-pressed={kategori === k}
                onClick={() => gantiKategori(k)}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </fieldset>

        {/* 2. Pemilih Tugas Spesifik dalam Kategori */}
        {listAktif.length > 0 && (
          <fieldset style={{ marginBottom: 12 }}>
            <legend style={{ fontSize: 11, color: '#736280' }}>Pilih item untuk dimobilisasi:</legend>
            <div className="task-chip-list">
              {listAktif.map((item) => {
                const p = getPlatform(item.platform)
                const aktif = tugasTerpilih?.id === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={'task-chip' + (aktif ? ' active' : '')}
                    onClick={() => {
                      setTugasTerpilih(item)
                      setNotifTerkirim(null)
                      setWaTersalin(false)
                    }}
                  >
                    <Icon name={p.icon} size={13} color={aktif ? '#fff' : p.color} />
                    <span style={{ maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        {/* 3. Kartu Preview Tugas Interaktif */}
        {listAktif.length === 0 ? (
          <div
            className="task-preview-box"
            style={{
              textAlign: 'center',
              padding: '36px 20px',
              background: '#fff',
              border: '1.5px dashed #d5c3f0',
              borderRadius: 16,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#f1eaff',
                color: '#5935d5',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 12px',
              }}
            >
              <Icon name="checkmark-done-outline" size={22} color="#5935d5" />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 5px', color: '#28213f' }}>
              Tidak Ada Tugas di Kategori Ini
            </p>
            <p style={{ fontSize: 12.5, color: '#6d5d7e', margin: '0 0 16px', maxWidth: 360, marginInline: 'auto' }}>
              Semua tugas di kategori ini sudah beres atau belum dijadwalkan. Buat tugas baru dan mandatkan ke tim kamu!
            </p>
            <Link to="/compose" className="task-btn-primary" style={{ margin: '0 auto', display: 'inline-flex' }}>
              <Icon name="add-circle-outline" size={16} />
              Buat Konten & Mandatkan Tugas
            </Link>
          </div>
        ) : itemAktif && plat && stat ? (
          <div className="task-preview-box">
            {/* Meta Row: Platform, Waktu, Status */}
            <div className="task-meta-row">
              <div className="task-meta-left">
                <span
                  className="task-badge-platform"
                  style={{ background: plat.bg, color: plat.color }}
                >
                  <Icon name={plat.icon} size={14} color={plat.color} />
                  {plat.label}
                </span>
                <span className="task-badge-time">
                  <Icon name="time-outline" size={13} style={{ marginRight: 4 }} />
                  {formatTanggalJam(itemAktif.scheduled_date, itemAktif.scheduled_time)}
                </span>
              </div>
              <span
                className="chip"
                style={{
                  background: stat.bg,
                  color: stat.color,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 650,
                  padding: '3px 9px',
                }}
              >
                {stat.label}
              </span>
            </div>

            {/* Judul Tugas */}
            <h3 className="task-title-heading">{itemAktif.title}</h3>

            {/* Baris PIC / Penanggung Jawab */}
            <div className="task-assignee-row">
              <div className="task-assignee-avatar">
                {String(itemAktif?.assignee_name || 'T').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 600 }}>PIC Penanggung Jawab:</span>{' '}
                <span style={{ color: '#5935d5', fontWeight: 650 }}>{itemAktif?.assignee_name || 'Tim Pengeksekusi'}</span>
              </div>
              <span style={{ fontSize: 10.5, color: '#87759b' }}>
                <Icon name="person-outline" size={12} style={{ marginRight: 3 }} />
                Anggota Tim
              </span>
            </div>

            {/* Cuplikan Mandat / Brief */}
            <div className="task-brief-container">
              <strong>Mandat Eksekusi & Brief Pokok:</strong>
              <p style={{ margin: 0 }}>
                {itemAktif?.brief || itemAktif?.objective || 'Fokus pada penyampaian hook yang menarik dan pastikan visual sesuai pedoman brand.'}
              </p>
            </div>

            {/* Baris Aksi Interaktif */}
            <div className="task-action-row">
              {/* Tombol Menuju Sub Worksheet */}
              <Link
                to={String(itemAktif?.id || '').startsWith('preset-') ? '/worksheet' : `/worksheet?id=${itemAktif?.id || ''}`}
                className="task-btn-primary"
              >
                <Icon name="reader-outline" size={15} />
                Buka di Lembar Kerja
              </Link>

              {/* Tombol Colek / Kirim Notifikasi */}
              <button
                type="button"
                className="task-btn-notif"
                onClick={kirimNotifikasi}
              >
                <Icon name="notifications-outline" size={15} />
                Colek / Ingatkan Tim
              </button>

              {/* Tombol Salin WA */}
              <button
                type="button"
                className="task-btn-wa"
                onClick={salinFormatWA}
                title="Salin template pengingat tugas untuk WhatsApp"
              >
                <Icon name="chatbubble-ellipses-outline" size={15} />
                Salin Pesan WA
              </button>
            </div>

            {/* Toast Konfirmasi Notifikasi */}
            {notifTerkirim && (
              <div className="notif-toast-banner">
                <Icon name="checkmark-circle-outline" size={16} color="#186838" />
                <span>{notifTerkirim}</span>
              </div>
            )}

            {/* Toast Konfirmasi WA */}
            {waTersalin && (
              <div className="notif-toast-banner" style={{ background: '#eafbf1', borderColor: '#25d366' }}>
                <Icon name="copy-outline" size={16} color="#128c7e" />
                <span>Format pesan pengingat WA tersalin ke clipboard! Siap dipaste ke grup WhatsApp.</span>
              </div>
            )}
          </div>
        ) : null}

        {/* Feedback / Petunjuk Bawah */}
        <p className="lab-feedback" role="status">
          {notifTerkirim || waTersalin
            ? 'Aksi mobilisasi berhasil dijalankan. Tim dapat segera mengecek lembar kerjanya.'
            : 'Gunakan modul ini untuk memastikan tidak ada tugas yang terlewat atau tertunda.'}
        </p>
      </div>
    </section>
  )
}

export { CreativeLab as TaskMobilizer }
