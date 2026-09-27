import CreativeLab from '../components/CreativeLab'
import StudioInteractions from '../components/StudioInteractions'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import { supabase } from '../lib/supabaseClient'
import { addDays, dayOfYear, isoDate, todayIso } from '../lib/dates'
import AppShell from '../components/AppShell'
import Icon from '../components/Icon'
import PengumumanKlien from '../components/PengumumanKlien'
import TrialOffer from '../components/TrialOffer'

// Halaman Home ala Plann: bukan dashboard analitik (itu tugas /dashboard),
// tapi titik berangkat yang komersial dan ramah — menyapa, menunjukkan ide
// hari ini, dan menawarkan tiga jalan pintas paling umum ke tempat orang
// mau pergi. Kartu-kartu di bawah cuma pintasan navigasi dan tidak
// menyimpan apa pun sendiri; warna gradiennya bikinan sendiri, bukan
// ilustrasi yang ditiru dari mana pun.
const KARTU = [
  {
    icon: 'bulb-outline',
    judul: 'Cari inspirasi dulu',
    deskripsi: 'Temukan sudut cerita baru untuk konten berikutnya.',
    aksi: 'Cari ide',
    path: '/content-bank',
  },
  {
    icon: 'compass-outline',
    judul: 'Bikin rencana, yuk',
    deskripsi: 'Pilih kerangka cerita. Tinggal sesuaikan dengan brand kamu.',
    aksi: 'Lihat template',
    path: '/strategy',
  },
  {
    icon: 'create-outline',
    judul: 'Idenya sudah siap?',
    deskripsi: 'Taruh idemu di kalender. Lengkapi materi dan ajak tim mengerjakan.',
    aksi: 'Mulai menyusun',
    path: '/compose',
  },
]

function jamSapaan() {
  const jam = new Date().getHours()
  if (jam < 11) return 'Selamat pagi'
  if (jam < 15) return 'Selamat siang'
  if (jam < 19) return 'Selamat sore'
  return 'Selamat malam'
}

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tenant } = useTenantContext()
  const namaDepan = (user?.email ?? '').split('@')[0]

  // Ide harian — sumbernya sama dengan yang dipakai kalender (lihat
  // useAgenda.js): satu katalog kecil, dan tanggalnya yang memilih ide mana
  // yang tampil, deterministik tanpa perlu baris data per tanggal. Panah
  // kiri/kanan sungguhan menggeser tanggal yang dilihat, bukan cuma hiasan.
  const [ideHarian, setIdeHarian] = useState([])
  const [offsetHari, setOffsetHari] = useState(0)

  useEffect(() => {
    if (!supabase) return
    let batal = false
    supabase
      .from('ide_konten_harian')
      .select('teks')
      .order('urutan')
      .then(({ data }) => { if (!batal) setIdeHarian(data?.map((d) => d.teks) ?? []) })
    return () => { batal = true }
  }, [])

  const tanggalDilihat = addDays(new Date(`${todayIso()}T00:00:00`), offsetHari)
  const ideHariIni = ideHarian.length
    ? ideHarian[dayOfYear(tanggalDilihat) % ideHarian.length]
    : null
  const labelTanggal = offsetHari === 0 ? 'Hari ini' : isoDate(tanggalDilihat).split('-').reverse().join('/')

  return (
    <AppShell maxWidth={1440}>
      <div className="home-workspace">
      <div className="home-welcome">
        <div><h1 className="home-sapaan">{jamSapaan()}{namaDepan ? `, ${namaDepan}` : ''} <span aria-hidden="true">👋</span></h1>
        <p className="page-subtitle">{tenant?.name || 'Ruang kerja kamu'} · Mau mulai dari mana hari ini?</p></div>
      <div className="home-header">
        {ideHariIni && (
          <button
            type="button"
            className="home-header-ide"
            onClick={() => navigate(`/compose?ide=${encodeURIComponent(ideHariIni)}&tanggal=${isoDate(tanggalDilihat)}`)}
            title="Pakai ide ini untuk konten baru"
          >
            <Icon name="bulb-outline" size={13} color="var(--accent)" />
            <span>Ide hari ini: <strong>{ideHariIni}</strong></span>
          </button>
        )}

        <div className="home-header-nav">
          <button type="button" onClick={() => setOffsetHari((o) => o - 1)} aria-label="Hari sebelumnya">
            <Icon name="chevron-back-outline" size={14} />
          </button>
          <span>{labelTanggal}</span>
          <button type="button" onClick={() => setOffsetHari((o) => o + 1)} aria-label="Hari berikutnya">
            <Icon name="chevron-forward-outline" size={14} />
          </button>
        </div>
      </div>

      </div>
      <PengumumanKlien />

      <div className="home-kartu-grid">
        {KARTU.map((k) => (
          <button
            key={k.path}
            type="button"
            className="home-kartu"

            onClick={() => navigate(k.path)}
          >
            <div className="home-art home-art-illustrated" aria-hidden="true">
              <img src={k.icon === 'bulb-outline' ? '/images/studio-mobile-lavender.png' : k.icon === 'compass-outline' ? '/images/studio-review.png' : '/images/studio-team-hero.png'} alt="" loading="lazy"/>
              <span className="art-sticker">{k.icon === 'bulb-outline' ? 'Temukan sudut ceritamu' : k.icon === 'compass-outline' ? 'Dari brief jadi rencana' : 'Saatnya bikin sesuatu'}</span>
            </div>
            <p className="home-kartu-judul">{k.judul}</p>
            <p className="home-kartu-deskripsi">{k.deskripsi}</p>
            <span className="home-kartu-aksi" >
              {k.aksi}
              <Icon name="arrow-forward-outline" size={13} />
            </span>
          </button>
        ))}
      </div>
      <div className="home-next"><Icon name="calendar-outline" size={19} /><span>Sudah punya rencana? Cek agenda tim kamu.</span><button type="button" className="btn" onClick={() => navigate('/content-calendar')}>Buka kalender</button></div>
      <CreativeLab inApp/>
      <StudioInteractions inApp/>
      <TrialOffer />
      </div>
    </AppShell>
  )
}
