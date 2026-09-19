import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import { supabase } from '../lib/supabaseClient'
import { addDays, dayOfYear, isoDate, todayIso } from '../lib/dates'
import { PLATFORMS } from '../config/platforms'
import AppShell from '../components/AppShell'
import Icon from '../components/Icon'

// Halaman Home ala Plann: bukan dashboard analitik (itu tugas /dashboard),
// tapi titik berangkat yang komersial dan ramah — menyapa, menunjukkan ide
// hari ini, dan menawarkan tiga jalan pintas paling umum ke tempat orang
// mau pergi. Kartu-kartu di bawah cuma pintasan navigasi dan tidak
// menyimpan apa pun sendiri; warna gradiennya bikinan sendiri, bukan
// ilustrasi yang ditiru dari mana pun.
const KARTU = [
  {
    icon: 'bulb-outline',
    judul: 'Butuh ide baru',
    deskripsi: 'Lihat bank ide konten dan ide harian yang sudah disiapkan untuk setiap tanggal.',
    aksi: 'Cari ide',
    path: '/content-bank',
    gradien: 'linear-gradient(150deg, #EAF3FF 0%, #DCEBFF 55%, #CFE3FF 100%)',
    warnaIkon: '#3E6FD9',
  },
  {
    icon: 'compass-outline',
    judul: 'Mulai dari kerangka',
    deskripsi: 'Pakai salah satu template strategi konten — pilar dan urutannya sudah ditata.',
    aksi: 'Lihat template',
    path: '/strategy',
    gradien: 'linear-gradient(150deg, #EAFBF5 0%, #DAF5EA 55%, #C9EEDD 100%)',
    warnaIkon: '#2F9C6B',
  },
  {
    icon: 'create-outline',
    judul: 'Sudah ada ide sendiri',
    deskripsi: 'Langsung susun konten baru, jadwalkan tanggal dan platform tayangnya.',
    aksi: 'Mulai menyusun',
    path: '/compose',
    gradien: 'linear-gradient(150deg, #F3EEFF 0%, #EAE1FF 55%, #DFD2FF 100%)',
    warnaIkon: '#7B5CD6',
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
    <AppShell>
      <div className="home-header">
        <div className="home-header-platform" title="Platform yang didukung">
          {PLATFORMS.map((p) => (
            <span key={p.key} style={{ background: p.bg, color: p.color }}>
              <Icon name={p.icon} size={14} />
            </span>
          ))}
        </div>

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

      <h1 className="home-sapaan">
        {jamSapaan()}{namaDepan ? `, ${namaDepan}` : ''} <span aria-hidden="true">👋</span>
      </h1>
      <p className="page-subtitle" style={{ marginBottom: 22 }}>
        {tenant?.name ? `Ruang kerja ${tenant.name} — mau mulai dari mana hari ini?` : 'Mau mulai dari mana hari ini?'}
      </p>

      <div className="home-kartu-grid">
        {KARTU.map((k) => (
          <button
            key={k.path}
            type="button"
            className="home-kartu"
            style={{ background: k.gradien }}
            onClick={() => navigate(k.path)}
          >
            <span className="home-kartu-ikon" style={{ color: k.warnaIkon }}>
              <Icon name={k.icon} size={20} />
            </span>
            <p className="home-kartu-judul">{k.judul}</p>
            <p className="home-kartu-deskripsi">{k.deskripsi}</p>
            <span className="home-kartu-aksi" style={{ color: k.warnaIkon }}>
              {k.aksi}
              <Icon name="arrow-forward-outline" size={13} />
            </span>
          </button>
        ))}
      </div>
    </AppShell>
  )
}
