import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import AppShell from '../components/AppShell'
import Icon from '../components/Icon'

// Halaman Home ala Plann: bukan dashboard analitik (itu tugas /dashboard),
// tapi titik berangkat yang menyapa dan menawarkan tiga jalan pintas paling
// umum ke tempat orang mau pergi — dapat ide, pakai kerangka yang sudah ada,
// atau langsung menulis. Kartu-kartu di bawah cuma pintasan navigasi, tidak
// menyimpan apa pun sendiri.
const KARTU = [
  {
    icon: 'bulb-outline',
    judul: 'Butuh ide baru',
    deskripsi: 'Lihat bank ide konten dan ide harian yang sudah disiapkan untuk setiap tanggal.',
    aksi: 'Buka bank ide',
    path: '/content-bank',
  },
  {
    icon: 'compass-outline',
    judul: 'Mulai dari kerangka',
    deskripsi: 'Pakai salah satu template strategi konten — pilar dan urutannya sudah ditata.',
    aksi: 'Lihat strategi',
    path: '/strategy',
  },
  {
    icon: 'create-outline',
    judul: 'Sudah ada ide sendiri',
    deskripsi: 'Langsung susun konten baru, jadwalkan tanggal dan platform tayangnya.',
    aksi: 'Susun konten',
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

  return (
    <AppShell
      title={`${jamSapaan()}${namaDepan ? `, ${namaDepan}` : ''}`}
      description={tenant?.name ? `Ruang kerja ${tenant.name} — mau mulai dari mana hari ini?` : 'Mau mulai dari mana hari ini?'}
    >
      <div className="home-kartu-grid">
        {KARTU.map((k) => (
          <button key={k.path} type="button" className="home-kartu" onClick={() => navigate(k.path)}>
            <span className="home-kartu-ikon">
              <Icon name={k.icon} size={20} />
            </span>
            <p className="home-kartu-judul">{k.judul}</p>
            <p className="home-kartu-deskripsi">{k.deskripsi}</p>
            <span className="home-kartu-aksi">
              {k.aksi}
              <Icon name="arrow-forward-outline" size={13} />
            </span>
          </button>
        ))}
      </div>
    </AppShell>
  )
}
