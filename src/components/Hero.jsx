import { useEffect, useState } from 'react'

// Direstyle ala referensi "fitplan" (Referensi Design UI UX/referensi 5.jpg) —
// bukan lagi banner gradient lebar, tapi kartu sapaan putih ringkas dengan
// input "mau ngapain hari ini" + pilihan cepat Now/Besok/Minggu depan/Custom.
// Sapaan berubah sesuai jam, jam digital jalan real-time.

const SUBTEXTS = [
  'Semoga harimu produktif — ada beberapa konten yang perlu perhatian kamu.',
  'Engagement rate naik dibanding minggu lalu.',
  'Ada konten yang menunggu approval kamu.',
]

function greetingFor(hour) {
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export default function Hero({ userName = 'mas', onQuickAction }) {
  const [now, setNow] = useState(new Date())
  const [subtext] = useState(() => SUBTEXTS[Math.floor(Math.random() * SUBTEXTS.length)])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  const greeting = `${greetingFor(now.getHours())}, ${userName}`

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 16, padding: '20px 20px 16px' }}>
      <p style={{ fontSize: 19, fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)' }}>
        {greeting} <span aria-hidden="true">👋</span>
      </p>
      <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>{subtext}</p>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-1)',
        border: '0.5px solid var(--border)', borderRadius: 10, padding: '9px 12px', marginBottom: 12,
      }}>
        <i className="ti ti-sparkles" style={{ fontSize: 14, color: 'var(--accent)' }} aria-hidden="true" />
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Mau bikin apa hari ini...</span>
        <i className="ti ti-send-2" style={{ fontSize: 14, color: 'var(--accent)', marginLeft: 'auto', cursor: 'pointer' }} aria-hidden="true" />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button className="hero-pill filled" onClick={() => onQuickAction?.('now')}>
          <i className="ti ti-bolt" aria-hidden="true" /> Sekarang
        </button>
        <button className="hero-pill" onClick={() => onQuickAction?.('draft-jadwal')}>
          <i className="ti ti-calendar-event" aria-hidden="true" /> Besok
        </button>
        <button className="hero-pill" onClick={() => onQuickAction?.('minggu-depan')}>
          <i className="ti ti-calendar-plus" aria-hidden="true" /> Minggu depan
        </button>
        <button className="hero-pill" onClick={() => onQuickAction?.('ringkas-performa')}>
          <i className="ti ti-adjustments" aria-hidden="true" /> Custom
        </button>
      </div>
    </div>
  )
}
