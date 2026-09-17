import Icon from './Icon'

// Kerangka halaman untuk semua layar sebelum login: Masuk, Daftar, Undangan.
//
// PERBAIKAN TAMPILAN DI LAYAR KECIL
//
// Sebelumnya lebar kolomnya dipaksa dua bagian sama besar tanpa memperhatikan
// lebar layar. Di ponsel berlayar 375 piksel, tiap kolom hanya kebagian sekitar
// 167 piksel, sehingga kalimat di panel kiri pecah menjadi satu kata per baris
// dan sebagian terpotong keluar layar.
//
// Sekarang panel kiri disembunyikan di layar sempit dan diganti logo ringkas di
// atas formulir. Panel itu isinya ajakan, bukan sesuatu yang dibutuhkan untuk
// masuk, jadi di ruang yang terbatas ia yang mengalah.

const POINTS = [
  { icon: 'document-text-outline', text: 'Setiap konten punya brief, bukan cuma judul' },
  { icon: 'calendar-outline', text: 'Semua akun sosial media dalam satu kalender' },
  { icon: 'people-outline', text: 'Tim tahu siapa mengerjakan apa dan kapan tayang' },
]

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-promo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name="layers-outline" size={15} color="#fff" />
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>plannersm.co</span>
          </div>

          <div>
            <p style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: 20 }}>
              Berhenti mengurus konten lewat catatan yang tercecer.
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
            Ruang kerja sendiri, tim kamu, brand kamu.
          </p>
        </div>

        <div className="auth-form">
          {/* Hanya tampil di layar sempit, menggantikan panel kiri yang
              disembunyikan, supaya orang tetap tahu ini aplikasi apa. */}
          <div className="auth-brand-mobile">
            <div
              style={{
                width: 26, height: 26, borderRadius: 7, background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name="layers-outline" size={15} color="var(--accent-text)" />
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>plannersm.co</span>
          </div>

          <p style={{ fontWeight: 600, fontSize: 18, letterSpacing: '-0.01em', marginBottom: 4 }}>{title}</p>
          {subtitle && <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 22 }}>{subtitle}</p>}
          {children}
          {footer && <div style={{ marginTop: 18, fontSize: 12.5, color: 'var(--text-secondary)', textAlign: 'center' }}>{footer}</div>}
        </div>
      </div>
    </div>
  )
}
