import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { PLATFORMS } from '../config/platforms'
import { STATUSES } from '../config/statuses'

// Halaman depan publik plannersm.co.
//
// Sebelum ini, siapa pun yang mengetik alamat plannersm.co langsung disambut
// formulir login tanpa penjelasan apa pun. Orang yang baru dengar namanya
// tidak akan mendaftar ke aplikasi yang tidak ia mengerti gunanya.
//
// SATU ATURAN YANG DIPEGANG DI SELURUH ISI HALAMAN INI: hanya menyebut yang
// benar-benar sudah bisa dipakai. Aplikasi ini belum bisa memposting otomatis
// ke sosial media dan belum punya AI asisten, jadi tidak ada satu kalimat pun
// di sini yang mengklaim keduanya. Menjual janji yang belum ada hanya
// memindahkan kekecewaan ke hari orang mendaftar, dan itu lebih mahal
// daripada kehilangan satu pendaftar hari ini.
//
// Bagian "Yang belum ada" di bawah memang tidak biasa untuk sebuah halaman
// jualan. Itu disengaja: calon pengguna yang tahu batasnya sejak awal tidak
// akan merasa tertipu, dan kejujuran itu sendiri jadi pembeda di kategori yang
// penuh klaim berlebihan.

const MASALAH = [
  {
    ikon: 'chatbubbles-outline',
    judul: 'Brief nyangkut di chat',
    isi: 'Ide dibahas di grup, keputusan tenggelam di antara ratusan pesan. Yang mengerjakan akhirnya menebak-nebak.',
  },
  {
    ikon: 'grid-outline',
    judul: 'Jadwal tersebar di banyak tempat',
    isi: 'Instagram di satu spreadsheet, TikTok di catatan lain, LinkedIn di kepala satu orang. Tidak ada yang punya gambaran utuh.',
  },
  {
    ikon: 'help-circle-outline',
    judul: 'Tidak jelas siapa mengerjakan apa',
    isi: 'Semua tahu kontennya harus jadi, tidak ada yang merasa itu bagiannya. Deadline lewat tanpa ada yang sadar.',
  },
]

const FITUR = [
  {
    ikon: 'document-text-outline',
    judul: 'Brief menempel pada kontennya',
    isi: 'Tujuan, target audiens, pesan utama, draf caption, CTA, hashtag, dan catatan produksi. Semuanya di satu tempat bersama kontennya, bukan tercecer di chat.',
  },
  {
    ikon: 'calendar-outline',
    judul: 'Satu kalender untuk semua akun',
    isi: 'Tujuh platform dalam satu tampilan mingguan dengan sumbu jam. Bentrok jadwal kelihatan sebelum terjadi, bukan sesudah.',
  },
  {
    ikon: 'albums-outline',
    judul: 'Papan kerja lima tahap',
    isi: 'Dari ide, draft, review, terjadwal, sampai tayang. Geser kartunya untuk memindahkan tahap, klik untuk membuka briefnya.',
  },
  {
    ikon: 'people-outline',
    judul: 'Peran dan penugasan yang tegas',
    isi: 'Admin menugaskan, staff mengerjakan bagiannya. Masing-masing punya dashboard sendiri sesuai yang ia butuhkan.',
  },
  {
    ikon: 'bulb-outline',
    judul: 'Bank ide dan content pillar',
    isi: 'Ide ditampung dulu sebelum jadi pekerjaan, lalu diangkat jadi konten ketika waktunya tepat. Pillar menjaga sebarannya tetap seimbang.',
  },
  {
    ikon: 'color-palette-outline',
    judul: 'Pakai merek kamu sendiri',
    isi: 'Nama, logo, dan warna per ruang kerja. Kalau kamu agency, tiap klien bisa punya ruang kerjanya sendiri dengan tampilannya sendiri.',
  },
]

const BELUM_ADA = [
  'Posting otomatis ke sosial media. Kamu tetap mempublikasikan sendiri dari aplikasi platformnya.',
  'Tarikan angka follower dan engagement otomatis. Untuk sekarang dicatat manual, dan grafiknya tumbuh dari catatan itu.',
  'AI pembuat caption. Sedang kami siapkan, belum ada di versi ini.',
]

const LANGKAH = [
  { nomor: '1', judul: 'Buat ruang kerja', isi: 'Isi nama brand, pilih titik awal content pillar. Satu menit, tanpa kartu kredit.' },
  { nomor: '2', judul: 'Undang tim', isi: 'Kirim link undangan, tentukan siapa admin dan siapa staff.' },
  { nomor: '3', judul: 'Mulai dari satu konten', isi: 'Tulis judulnya, isi briefnya, tentukan tanggalnya. Sisanya mengikuti.' },
]

const FAQ = [
  {
    t: 'Apakah ini gratis?',
    j: 'Selama masa awal ini gratis dan bisa dipakai penuh. Kalau nanti ada paket berbayar, pengguna yang sudah bergabung akan diberi tahu lebih dulu, bukan tiba-tiba terkunci.',
  },
  {
    t: 'Berapa orang yang bisa diundang?',
    j: 'Belum ada batas anggota per ruang kerja. Satu akun bisa membuat sampai sepuluh ruang kerja.',
  },
  {
    t: 'Bisa dipakai agency yang memegang banyak klien?',
    j: 'Bisa, dan memang itu salah satu alasan aplikasi ini dibangun. Tiap klien jadi ruang kerja terpisah dengan nama, logo, dan warnanya sendiri. Data antar ruang kerja benar-benar terpisah.',
  },
  {
    t: 'Datanya aman?',
    j: 'Tiap ruang kerja terisolasi di tingkat database, bukan hanya disembunyikan di tampilan. Anggota satu ruang kerja tidak bisa membaca data ruang kerja lain meski mencoba lewat jalur teknis.',
  },
  {
    t: 'Kalau saya cuma bekerja sendiri?',
    j: 'Tetap masuk akal. Fitur brief, kalender, dan papan kerjanya sama berguna untuk satu orang. Undang tim kapan saja kalau nanti bertambah.',
  },
]

function Bagian({ children, style }) {
  return <section style={{ padding: '72px 22px', ...style }}>{children}</section>
}

function Isi({ children, lebar = 1080 }) {
  return <div style={{ maxWidth: lebar, margin: '0 auto' }}>{children}</div>
}

export default function Landing() {
  const [menuTerbuka, setMenuTerbuka] = useState(false)

  // Halaman publik selalu terang, tidak mengikuti warna merek ruang kerja
  // siapa pun. Warna aksen bisa tertinggal di CSS variable kalau pengunjung
  // sebelumnya sempat login, jadi dikembalikan ke warna bawaan di sini.
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', '#6B5EE0')
    document.documentElement.style.setProperty('--accent-text', '#FFFFFF')
  }, [])

  return (
    <div style={{ background: 'var(--surface-2)', minHeight: '100vh' }}>
      {/* ---------- Navigasi ---------- */}
      <header className="lp-nav">
        <Isi>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: 8, background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon name="layers-outline" size={16} color="#fff" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 15.5, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                plannersm.co
              </span>
            </Link>

            <nav className="lp-nav-links">
              <a href="#fitur">Fitur</a>
              <a href="#cara-kerja">Cara kerja</a>
              <a href="#batas">Batasnya</a>
              <a href="#tanya">Tanya jawab</a>
            </nav>

            <div className="lp-nav-cta">
              <Link to="/login" className="btn btn-sm">Masuk</Link>
              <Link to="/signup" className="btn btn-sm btn-primary">Daftar gratis</Link>
            </div>

            <button
              type="button"
              className="lp-nav-toggle"
              onClick={() => setMenuTerbuka((v) => !v)}
              aria-label="Buka menu"
            >
              <Icon name={menuTerbuka ? 'close-outline' : 'menu-outline'} size={20} />
            </button>
          </div>

          {menuTerbuka && (
            <div className="lp-nav-mobile">
              <a href="#fitur" onClick={() => setMenuTerbuka(false)}>Fitur</a>
              <a href="#cara-kerja" onClick={() => setMenuTerbuka(false)}>Cara kerja</a>
              <a href="#batas" onClick={() => setMenuTerbuka(false)}>Batasnya</a>
              <a href="#tanya" onClick={() => setMenuTerbuka(false)}>Tanya jawab</a>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <Link to="/login" className="btn btn-sm" style={{ flex: 1 }}>Masuk</Link>
                <Link to="/signup" className="btn btn-sm btn-primary" style={{ flex: 1 }}>Daftar gratis</Link>
              </div>
            </div>
          )}
        </Isi>
      </header>

      {/* ---------- Hero ---------- */}
      <Bagian style={{ paddingTop: 84, paddingBottom: 56 }}>
        <Isi lebar={820}>
          <div style={{ textAlign: 'center' }}>
            <span className="chip" style={{ background: 'var(--accent-bg)', color: 'var(--accent)', borderColor: 'transparent', marginBottom: 20 }}>
              Untuk tim konten dan agency sosial media
            </span>

            <h1 className="lp-title">
              Berhenti mengurus konten lewat catatan yang tercecer.
            </h1>

            <p className="lp-sub">
              plannersm.co menyatukan brief, jadwal, dan pembagian tugas seluruh akun sosial media
              kamu ke dalam satu ruang kerja. Supaya tim tidak lagi bertanya
              "ini maksudnya apa" dan "ini bagian siapa".
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
              <Link to="/signup" className="btn btn-primary" style={{ textDecoration: 'none', padding: '11px 20px' }}>
                Mulai gratis <Icon name="arrow-forward-outline" size={15} />
              </Link>
              <a href="#fitur" className="btn" style={{ textDecoration: 'none', padding: '11px 20px' }}>
                Lihat fiturnya
              </a>
            </div>

            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 14 }}>
              Tanpa kartu kredit. Ruang kerja pertama jadi dalam satu menit.
            </p>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 34 }}>
              {PLATFORMS.map((p) => (
                <div
                  key={p.key}
                  title={p.label}
                  style={{
                    width: 38, height: 38, borderRadius: 11, background: p.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Icon name={p.icon} size={19} color={p.color} />
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 10 }}>
              Tujuh platform dalam satu kalender
            </p>
          </div>
        </Isi>
      </Bagian>

      {/* ---------- Pratinjau papan ---------- */}
      <Bagian style={{ paddingTop: 0, paddingBottom: 72 }}>
        <Isi lebar={940}>
          <div
            style={{
              border: '0.5px solid var(--border)', borderRadius: 18, padding: 18,
              background: 'var(--bg-page)', boxShadow: 'var(--shadow-md)',
            }}
          >
            <div className="lp-board">
              {STATUSES.map((s, i) => (
                <div
                  key={s.key}
                  style={{
                    background: 'var(--surface-1)', borderRadius: 11, padding: 10,
                    borderTop: `3px solid ${s.color}`, minHeight: 132,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 9 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: s.color }}>{s.label}</span>
                  </div>
                  {Array.from({ length: [2, 1, 1, 2, 1][i] }).map((_, k) => (
                    <div
                      key={k}
                      style={{
                        background: 'var(--surface-2)', borderRadius: 8, padding: 8, marginBottom: 6,
                        border: '0.5px solid var(--border)', borderLeft: `3px solid ${s.color}`,
                      }}
                    >
                      <div style={{ height: 6, width: `${70 - k * 15}%`, background: 'var(--border-strong)', borderRadius: 99, marginBottom: 5 }} />
                      <div style={{ height: 5, width: '45%', background: 'var(--border)', borderRadius: 99 }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Isi>
      </Bagian>

      {/* ---------- Masalah ---------- */}
      <Bagian style={{ background: 'var(--bg-page)' }}>
        <Isi>
          <h2 className="lp-h2" style={{ textAlign: 'center' }}>Kalau ini terasa familier</h2>
          <p className="lp-h2-sub" style={{ textAlign: 'center' }}>
            Tiga hal yang hampir selalu terjadi pada tim konten yang tumbuh tanpa sistem.
          </p>

          <div className="lp-grid-3" style={{ marginTop: 40 }}>
            {MASALAH.map((m) => (
              <div key={m.judul} className="card">
                <div
                  style={{
                    width: 38, height: 38, borderRadius: 11, background: 'var(--danger-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                  }}
                >
                  <Icon name={m.ikon} size={19} color="var(--danger)" />
                </div>
                <p style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 6 }}>{m.judul}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{m.isi}</p>
              </div>
            ))}
          </div>
        </Isi>
      </Bagian>

      {/* ---------- Fitur ---------- */}
      <Bagian id="fitur">
        <Isi>
          <h2 className="lp-h2" style={{ textAlign: 'center' }}>Yang sudah bisa kamu pakai hari ini</h2>
          <p className="lp-h2-sub" style={{ textAlign: 'center' }}>
            Semua yang tertulis di bawah sudah berjalan, bukan rencana.
          </p>

          <div className="lp-grid-3" style={{ marginTop: 40 }}>
            {FITUR.map((f) => (
              <div key={f.judul} className="card">
                <div
                  style={{
                    width: 38, height: 38, borderRadius: 11, background: 'var(--accent-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                  }}
                >
                  <Icon name={f.ikon} size={19} color="var(--accent)" />
                </div>
                <p style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 6 }}>{f.judul}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.isi}</p>
              </div>
            ))}
          </div>
        </Isi>
      </Bagian>

      {/* ---------- Cara kerja ---------- */}
      <Bagian id="cara-kerja" style={{ background: 'var(--bg-page)' }}>
        <Isi lebar={900}>
          <h2 className="lp-h2" style={{ textAlign: 'center' }}>Tiga langkah untuk mulai</h2>

          <div className="lp-grid-3" style={{ marginTop: 40 }}>
            {LANGKAH.map((l) => (
              <div key={l.nomor}>
                <div
                  style={{
                    width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 15, marginBottom: 14,
                  }}
                >
                  {l.nomor}
                </div>
                <p style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 6 }}>{l.judul}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{l.isi}</p>
              </div>
            ))}
          </div>
        </Isi>
      </Bagian>

      {/* ---------- Batasnya, sengaja diakui terbuka ---------- */}
      <Bagian id="batas">
        <Isi lebar={760}>
          <div className="card" style={{ padding: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Icon name="information-circle-outline" size={20} color="var(--text-secondary)" />
              <h2 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>Yang belum bisa</h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 18 }}>
              Kami lebih suka kamu tahu ini sekarang daripada kecewa setelah mendaftar.
              plannersm.co adalah alat perencanaan, dan belum menjadi alat penerbitan.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {BELUM_ADA.map((b) => (
                <div key={b} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Icon name="close-circle-outline" size={17} color="var(--text-muted)" style={{ marginTop: 2 }} />
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{b}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 18, lineHeight: 1.6 }}>
              Sebagian batasan ini bukan soal kami belum membangunnya, tapi soal aturan platformnya sendiri.
              TikTok, misalnya, tidak mengizinkan penjadwalan lewat API pihak ketiga.
            </p>
          </div>
        </Isi>
      </Bagian>

      {/* ---------- Tanya jawab ---------- */}
      <Bagian id="tanya" style={{ background: 'var(--bg-page)' }}>
        <Isi lebar={760}>
          <h2 className="lp-h2" style={{ textAlign: 'center' }}>Tanya jawab</h2>

          <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQ.map((f) => (
              <details key={f.t} className="lp-faq">
                <summary>
                  {f.t}
                  <Icon name="chevron-down-outline" size={16} color="var(--text-muted)" />
                </summary>
                <p>{f.j}</p>
              </details>
            ))}
          </div>
        </Isi>
      </Bagian>

      {/* ---------- Penutup ---------- */}
      <Bagian>
        <Isi lebar={720}>
          <div
            style={{
              background: 'var(--text-primary)', borderRadius: 20, padding: '44px 30px',
              textAlign: 'center', color: '#fff',
            }}
          >
            <h2 style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 12 }}>
              Coba dulu dengan satu konten
            </h2>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.65, maxWidth: 460, margin: '0 auto 24px' }}>
              Tidak perlu memindahkan seluruh perencanaan sekarang. Buat satu ruang kerja,
              isi satu brief, lihat sendiri apakah cara kerjanya cocok untuk timmu.
            </p>
            <Link
              to="/signup"
              className="btn"
              style={{
                textDecoration: 'none', padding: '11px 22px',
                background: '#fff', color: 'var(--text-primary)', borderColor: '#fff',
              }}
            >
              Daftar gratis <Icon name="arrow-forward-outline" size={15} />
            </Link>
          </div>
        </Isi>
      </Bagian>

      {/* ---------- Footer ---------- */}
      <footer style={{ borderTop: '0.5px solid var(--border)', padding: '28px 22px' }}>
        <Isi>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 22, height: 22, borderRadius: 6, background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon name="layers-outline" size={13} color="#fff" />
              </div>
              <span style={{ fontWeight: 600, fontSize: 13 }}>plannersm.co</span>
            </div>

            <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              Perencanaan konten untuk tim dan agency sosial media.
            </p>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
              <Link to="/login" style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none' }}>Masuk</Link>
              <Link to="/signup" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Daftar</Link>
            </div>
          </div>
        </Isi>
      </footer>
    </div>
  )
}
