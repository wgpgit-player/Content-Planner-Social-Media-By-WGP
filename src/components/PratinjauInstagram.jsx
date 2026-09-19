import Icon from './Icon'

// Isi layar mockup telepon: halaman profil ala Instagram.
//
// ANGKANYA ASLI, BUKAN HIASAN — DAN BERGANTI SENDIRI SAAT AKUN TERSAMBUNG
//
// Godaan terbesar saat meniru tampilan profil Instagram adalah menulis
// "11K pengikut" supaya mockup-nya terlihat meyakinkan. Itu tidak dilakukan
// di sini. Selama akunnya belum benar-benar tersambung, aplikasi ini tidak
// punya angka pengikut, dan menampilkan angka karangan akan membuat orang
// mengira datanya nyata.
//
// Jadi ada dua keadaan, dan komponen ini berpindah sendiri di antaranya:
//
//   Belum tersambung  -> Konten / Terjadwal / Draf
//                        (angka milik kita, selalu benar)
//   Sudah tersambung  -> Postingan / Pengikut / Mengikuti
//                        (angka asli dari platform)
//
// Yang menentukan bukan tombol "Hubungkan" di Pengaturan — itu cuma
// penanda niat — melainkan ada tidaknya angka hasil sinkron di kolom
// followers_count (lihat migrasi social_accounts_angka_profil). Selama
// kolom itu null, artinya belum pernah ada data yang benar-benar diambil
// dari platform, dan yang ditampilkan tetap angka kita sendiri.
//
// Angka pengikut hanya bisa diambil untuk akun profesional (Business atau
// Creator) lewat Instagram Graph API dengan izin instagram_basic, dan itu
// mensyaratkan aplikasi developer terdaftar milik pemilik akunnya sendiri.
function ringkas(n) {
  // 12.400 -> "12,4 rb". Instagram memendekkan angka besar, dan tanpa ini
  // angka enam digit merusak lebar kolom di layar selebar telepon.
  //
  // Satu desimal dipertahankan sampai 99.999, sama seperti Instagram:
  // membulatkan 12.400 jadi "12 rb" terlalu banyak membuang — selisih 400
  // pengikut itu berarti bagi yang punya akunnya.
  if (n === null || n === undefined) return '-'
  if (n < 1000) return String(n)
  if (n < 1_000_000) {
    const rb = n / 1000
    return `${rb < 100 ? rb.toFixed(1).replace('.', ',') : Math.round(rb)} rb`
  }
  return `${(n / 1_000_000).toFixed(1).replace('.', ',')} jt`
}

function Statistik({ angka, label }) {
  return (
    <div className="ig-stat">
      <span className="ig-stat-angka">{angka}</span>
      <span className="ig-stat-label">{label}</span>
    </div>
  )
}

export default function PratinjauInstagram({
  handle,
  nama,
  bio,
  logoUrl,
  warnaAksen,
  jumlahKonten,
  jumlahTerjadwal,
  jumlahDraf,
  // Diisi hanya kalau akunnya benar-benar sudah disinkronkan dari platform.
  // Cukup periksa pengikut: kalau ia ada, berarti sinkron pernah berhasil.
  akunAsli,
  filter,
  onFilter,
  children,
}) {
  const tersambung = akunAsli?.followers_count !== null && akunAsli?.followers_count !== undefined

  return (
    <>
      {/* Bilah navigasi paling atas. Kalau akunnya sudah tersambung, yang
          dipakai username aslinya, bukan handle turunan nama workspace. */}
      <div className="ig-nav">
        <Icon name="chevron-back-outline" size={13} />
        <span className="ig-nav-handle">
          {tersambung && akunAsli.username ? `@${akunAsli.username}` : handle}
        </span>
        <Icon name="ellipsis-horizontal" size={13} />
      </div>

      {/* Avatar dan tiga angka */}
      <div className="ig-profil">
        {(tersambung && akunAsli.avatar_url) || logoUrl ? (
          <img src={(tersambung && akunAsli.avatar_url) || logoUrl} alt="" className="ig-avatar" />
        ) : (
          <span className="ig-avatar" style={{ background: warnaAksen, color: '#fff' }}>
            {(nama ?? 'W').charAt(0).toUpperCase()}
          </span>
        )}

        <div className="ig-stat-baris">
          {tersambung ? (
            <>
              <Statistik angka={ringkas(akunAsli.media_count)} label="Postingan" />
              <Statistik angka={ringkas(akunAsli.followers_count)} label="Pengikut" />
              <Statistik angka={ringkas(akunAsli.follows_count)} label="Mengikuti" />
            </>
          ) : (
            <>
              <Statistik angka={jumlahKonten} label="Konten" />
              <Statistik angka={jumlahTerjadwal} label="Terjadwal" />
              <Statistik angka={jumlahDraf} label="Draf" />
            </>
          )}
        </div>
      </div>

      {/* Nama dan bio */}
      <div className="ig-bio">
        <p className="ig-bio-nama">{nama}</p>
        {bio && <p className="ig-bio-teks">{bio}</p>}
      </div>

      {/* Baris tombol. Di Instagram asli isinya Ikuti dan Pesan; di sini
          tempatnya dipakai untuk saringan yang memang berfungsi, supaya
          tidak ada tombol yang cuma jadi pajangan. */}
      <div className="ig-tombol-baris">
        {[
          { key: 'semua', label: 'Semua' },
          { key: 'terjadwal', label: 'Terjadwal' },
          { key: 'idea', label: 'Draf' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            className={`ig-tombol${filter === t.key ? ' aktif' : ''}`}
            onClick={() => onFilter?.(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Baris tab jenis konten. Reel dan tag belum ada fiturnya, jadi
          diredupkan dan tidak bisa diklik — bukan tombol yang pura-pura
          aktif lalu tidak melakukan apa-apa. */}
      <div className="ig-tab">
        <span className="ig-tab-item aktif"><Icon name="grid-outline" size={14} /></span>
        <span className="ig-tab-item mati" title="Belum ada fiturnya"><Icon name="play-outline" size={14} /></span>
        <span className="ig-tab-item mati" title="Belum ada fiturnya"><Icon name="person-outline" size={14} /></span>
      </div>

      {children}
    </>
  )
}
