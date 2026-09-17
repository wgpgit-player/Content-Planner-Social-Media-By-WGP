import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'

// Panel sapaan di kepala dashboard.
//
// Panel ini sengaja hanya menampilkan, tidak mengatur. Tombol unggah dan hapus
// wallpaper pernah ada di sini dan justru mengganggu: keduanya melayang di atas
// gambar, terlihat setiap saat, padahal wallpaper hanya diganti sesekali.
// Pengaturannya sudah ada di halaman Pengaturan, tempat yang memang dicari
// orang ketika ingin mengubah tampilan ruang kerjanya.
//
// Yang tersisa di sini tiga hal yang benar-benar dipakai tiap hari: sapaan,
// satu kalimat tentang apa yang perlu diperhatikan, dan satu tombol menuju
// pekerjaan yang paling sering dilakukan.

function salamUntuk(jam) {
  if (jam < 11) return 'Selamat pagi'
  if (jam < 15) return 'Selamat siang'
  if (jam < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export default function Hero({ userName, backgroundUrl, jadwalHariIni = 0, perluDibrief = 0 }) {
  const navigate = useNavigate()
  const [sekarang, setSekarang] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setSekarang(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const adaGambar = Boolean(backgroundUrl)
  const salam = userName ? `${salamUntuk(sekarang.getHours())}, ${userName}` : salamUntuk(sekarang.getHours())

  // Kalimat kedua mengikuti keadaan sebenarnya, bukan basa-basi tetap.
  let ringkasan
  if (jadwalHariIni > 0) ringkasan = `Ada ${jadwalHariIni} konten dijadwalkan tayang hari ini.`
  else if (perluDibrief > 0) ringkasan = `${perluDibrief} konten belum punya brief.`
  else ringkasan = 'Tidak ada yang mendesak hari ini.'

  const teksUtama = adaGambar ? '#fff' : 'var(--text-primary)'
  const teksKedua = adaGambar ? 'rgba(255,255,255,0.82)' : 'var(--text-secondary)'

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 16,
        padding: '20px 22px',
        overflow: 'hidden',
        border: adaGambar ? 'none' : '0.5px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        background: adaGambar
          ? `linear-gradient(100deg, rgba(14,14,20,0.82) 0%, rgba(14,14,20,0.45) 55%, rgba(14,14,20,0.25) 100%), center/cover no-repeat url(${backgroundUrl})`
          : 'var(--surface-2)',
        minHeight: 104,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 220 }}>
        <p style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', color: teksUtama, marginBottom: 3 }}>
          {salam}
        </p>
        <p style={{ fontSize: 12.5, color: teksKedua }}>{ringkasan}</p>
      </div>

      <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/kanban')}>
        <Icon name="add-outline" size={15} /> Konten baru
      </button>
    </div>
  )
}
