import Icon from './Icon'

// Kerangka halaman untuk semua layar sebelum login (Masuk, Daftar, Undangan).
// Dipisah jadi komponen sendiri supaya ketiganya konsisten dan copy-nya
// cuma ditulis di satu tempat.
//
// Catatan white-label: teks di panel kiri sengaja netral — tidak menyebut
// organisasi tertentu — karena aplikasi ini dipakai banyak brand berbeda.
// Branding milik masing-masing workspace baru muncul setelah login.

const POINTS = [
  { icon: 'albums-outline', text: 'Rencanakan dari ide sampai tayang di satu papan kerja' },
  { icon: 'calendar-outline', text: 'Kalender konten lintas platform dalam satu tampilan' },
  { icon: 'people-outline', text: 'Kerja bareng tim dengan peran dan akses yang jelas' },
]

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div
        style={{
          display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          maxWidth: 860, width: '100%', borderRadius: 20, overflow: 'hidden',
          boxShadow: 'var(--shadow-md)', border: '0.5px solid var(--border)',
        }}
      >
        <div
          style={{
            background: 'var(--text-primary)', padding: 34, color: '#fff',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 32,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name="layers-outline" size={15} color="#fff" />
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Content Planner</span>
          </div>

          <div>
            <p style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: 20 }}>
              Satu ruang kerja untuk merencanakan konten semua akun sosial media.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {POINTS.map((p) => (
                <div key={p.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <Icon name={p.icon} size={15} color="rgba(255,255,255,0.65)" style={{ marginTop: 2 }} />
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5 }}>{p.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            Bikin workspace sendiri, undang tim, pakai brand kamu.
          </p>
        </div>

        <div style={{ background: 'var(--surface-2)', padding: 34, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontWeight: 600, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 4 }}>{title}</p>
          {subtitle && <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 22 }}>{subtitle}</p>}
          {children}
          {footer && <div style={{ marginTop: 18, fontSize: 12.5, color: 'var(--text-secondary)', textAlign: 'center' }}>{footer}</div>}
        </div>
      </div>
    </div>
  )
}
