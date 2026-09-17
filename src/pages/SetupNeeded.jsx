import Icon from '../components/Icon'

// Layar yang tampil ketika aplikasi versi produksi dibuka tapi variabel
// lingkungannya belum tertanam saat build.
//
// Sebelumnya kondisi ini tidak dibedakan dari mode preview lokal: aplikasi
// tetap terbuka seolah normal, lalu baru gagal di tengah alur dengan pesan
// singkat yang tidak menjelaskan harus berbuat apa. Karena penyebabnya selalu
// sama dan selalu di sisi konfigurasi hosting, lebih baik dinyatakan sejak awal
// beserta langkah perbaikannya.

const LANGKAH = [
  'Buka pengaturan project di layanan hosting kamu, bagian Environment Variables.',
  'Tambahkan kedua variabel di atas. Aktifkan untuk Production, Preview, dan Development.',
  'Jalankan deploy ulang TANPA build cache. Menambah variabel saja tidak mengubah build yang sudah jadi.',
]

function Baris({ nama }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
        background: 'var(--surface-1)', border: '0.5px solid var(--border)',
        borderRadius: 9, fontFamily: 'ui-monospace, monospace', fontSize: 12,
      }}
    >
      <Icon name="key-outline" size={14} color="var(--text-muted)" />
      <span>{nama}</span>
    </div>
  )
}

export default function SetupNeeded() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 560, padding: 30 }}>
        <div
          style={{
            width: 42, height: 42, borderRadius: 12, background: 'var(--warning-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}
        >
          <Icon name="construct-outline" size={21} color="var(--warning)" />
        </div>

        <h1 className="page-title" style={{ marginBottom: 6 }}>Aplikasi belum tersambung ke server</h1>
        <p className="page-subtitle" style={{ marginBottom: 22 }}>
          Versi yang sedang kamu buka ini dibangun tanpa kredensial Supabase, jadi belum bisa
          menyimpan atau membaca data apa pun. Ini masalah konfigurasi deployment, bukan kerusakan aplikasi.
        </p>

        <p className="section-label" style={{ marginBottom: 8 }}>VARIABEL YANG DIBUTUHKAN</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 22 }}>
          <Baris nama="VITE_SUPABASE_URL" />
          <Baris nama="VITE_SUPABASE_ANON_KEY" />
        </div>

        <p className="section-label" style={{ marginBottom: 10 }}>CARA MEMPERBAIKI</p>
        <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {LANGKAH.map((teks) => (
            <li key={teks} style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {teks}
            </li>
          ))}
        </ol>

        <p className="alert alert-info" style={{ marginTop: 20, display: 'flex', gap: 8 }}>
          <Icon name="information-circle-outline" size={15} style={{ marginTop: 1 }} />
          <span>
            Nilai keduanya ada di file <code>.env</code> pada komputer kamu. File itu memang tidak
            ikut terkirim ke repositori, jadi layanan hosting perlu diberi tahu terpisah.
          </span>
        </p>
      </div>
    </div>
  )
}
