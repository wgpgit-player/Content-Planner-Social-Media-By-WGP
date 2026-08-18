import { useEffect, useState } from 'react'

// Sapaan berubah sesuai jam, jam digital jalan real-time, dan sub-teks acak
// dari beberapa kemungkinan biar dashboard kerasa "hidup" tiap kali dibuka.
// Tombol aksi cepat masih placeholder (belum manggil AI beneran) — nanti
// disambungkan di Fase 5.5 (AI Asisten Operasional via chat).

const SUBTEXTS = [
  '8 konten dijadwalkan minggu ini, 3 masih perlu direview.',
  'Engagement rate naik dibanding minggu lalu.',
  'Ada 2 konten menunggu approval kamu.',
]

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function greetingFor(hour) {
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

function pad(n) {
  return n < 10 ? `0${n}` : `${n}`
}

export default function Hero({ userName = 'mas', onQuickAction }) {
  const [now, setNow] = useState(new Date())
  const [subtext] = useState(() => SUBTEXTS[Math.floor(Math.random() * SUBTEXTS.length)])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  const greeting = `${greetingFor(now.getHours())}, ${userName}`
  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  const dateline = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 16, padding: '20px 22px',
      marginBottom: 14, background: 'linear-gradient(120deg,#7C6FF0,#B06FE0 45%,#EC5FA0)', color: '#fff',
    }}>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 500, margin: '0 0 4px' }}>{greeting} 👋</p>
          <p style={{ fontSize: 12.5, opacity: 0.9, margin: '0 0 14px' }}>{subtext}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="hero-btn filled" onClick={() => onQuickAction?.('draft-jadwal')}>
              Buat draf jadwal
            </button>
            <button className="hero-btn" onClick={() => onQuickAction?.('ringkas-performa')}>
              Ringkas performa
            </button>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 22, fontWeight: 500, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{clock}</p>
          <p style={{ fontSize: 11, opacity: 0.85, margin: '2px 0 0' }}>{dateline}</p>
        </div>
      </div>
      <div style={{ position: 'absolute', right: -30, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'absolute', right: 60, bottom: -60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
    </div>
  )
}
