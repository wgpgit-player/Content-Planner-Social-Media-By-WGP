import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'

// Halaman depan publik plannersm.co.
//
// ARAH DESAIN
//
// Susunan dan ritme visualnya mengambil pola yang umum dipakai situs agensi
// papan atas: hero gelap dengan judul besar, pita statistik, teks berjalan,
// bagian gelap dan terang yang berselang-seling, kartu besar berpasangan,
// dan tombol berbentuk pil. Polanya diadaptasi, bukan disalin — warna aksen
// tetap ungu milik plannersm.co, dan seluruh kalimatnya ditulis sendiri.
//
// Ada alasan praktis kenapa palet aksennya tidak ikut diambil dari situs
// mana pun: aplikasi ini white-label. Tiap ruang kerja menyetel warna
// mereknya sendiri, dan halaman depan yang berwarna lain akan terasa
// seperti produk yang berbeda begitu orang masuk ke dalamnya.
//
// SATU ATURAN YANG DIPEGANG DI SELURUH ISI HALAMAN
//
// Hanya menyebut yang benar-benar sudah bisa dipakai. Tidak ada testimoni
// karangan, tidak ada logo klien yang belum ada, dan tidak ada angka yang
// tidak bisa dibuktikan. Bagian yang menunggu foto dibiarkan sebagai kotak
// penanda, bukan diisi gambar pinjaman.
//
// Bagian "Yang belum ada" memang tidak biasa untuk halaman jualan. Itu
// disengaja: orang yang tahu batasnya sejak awal tidak akan merasa tertipu,
// dan di kategori yang penuh klaim berlebihan, itu sendiri jadi pembeda.

// ---------------------------------------------------------------------------
// Isi halaman
// ---------------------------------------------------------------------------

// Angka yang bisa dibuktikan, bukan bukti sosial. plannersm.co belum punya
// ribuan pengguna, jadi yang ditampilkan adalah sifat produknya sendiri —
// itu jujur dan tetap memberi rasa padat pada pita ini.
const ANGKA = [
  { angka: '7', label: 'platform dalam satu kalender' },
  { angka: '32', label: 'hari penting Indonesia sudah terisi' },
  { angka: '5', label: 'tahap kerja, dari ide sampai tayang' },
]

const MASALAH = [
  {
    ikon: 'chatbubbles-outline',
    judul: 'Brief nyangkut di chat',
    isi: 'Ide dibahas di grup, keputusan tenggelam di antara ratusan pesan. Yang mengerjakan akhirnya menebak-nebak.',
  },
  {
    ikon: 'grid-outline',
    judul: 'Jadwal tersebar di mana-mana',
    isi: 'Instagram di satu spreadsheet, TikTok di catatan lain, LinkedIn di kepala satu orang. Tidak ada yang punya gambaran utuh.',
  },
  {
    ikon: 'help-circle-outline',
    judul: 'Tidak jelas siapa mengerjakan apa',
    isi: 'Semua tahu kontennya harus jadi, tidak ada yang merasa itu bagiannya. Tenggat lewat tanpa ada yang sadar.',
  },
  {
    ikon: 'mail-unread-outline',
    judul: 'Revisi klien jadi rantai panjang',
    isi: 'Desain dikirim lewat chat, komentarnya balas-balasan, dan tidak ada yang tahu versi mana yang akhirnya disetujui.',
  },
]

// Dua pintu masuk, sesuai dua jenis pemakai yang paling berbeda kebutuhannya.
const JALUR = [
  {
    label: 'Untuk tim in-house',
    judul: 'Satu tempat untuk seluruh konten brand kamu',
    isi: 'Brief, jadwal, pembagian tugas, dan persetujuan berada di tempat yang sama dengan kontennya. Tidak ada lagi menebak apa yang dimaksud, atau mencari file di chat minggu lalu.',
    poin: ['Brief menempel pada kontennya', 'Papan kerja lima tahap', 'Pengingat di jam tayang'],
  },
  {
    label: 'Untuk agensi',
    judul: 'Tiap klien punya ruang kerjanya sendiri',
    isi: 'Nama, logo, dan warna terpisah per klien. Kirim satu tautan, klien melihat rencana sebulan dan menyetujuinya sendiri tanpa perlu membuat akun.',
    poin: ['Ruang kerja terpisah per klien', 'Tautan klien tanpa akun', 'Jejak siapa menyetujui apa'],
  },
]

const FITUR = [
  {
    ikon: 'document-text-outline',
    judul: 'Brief menempel pada kontennya',
    isi: 'Tujuan, target audiens, pesan utama, draf caption, ajakan bertindak, hashtag, dan catatan produksi. Semuanya bersama kontennya, bukan tercecer di chat.',
  },
  {
    ikon: 'create-outline',
    judul: 'Menyusun sambil melihat feed-nya',
    isi: 'Layar terbelah: menyusun di kiri, pratinjau feed berubah di kanan saat kamu mengetik. Penghitung karakter dan hashtag mencegah caption terpotong diam-diam.',
  },
  {
    ikon: 'compass-outline',
    judul: 'Strategi yang bisa ditanam jadi jadwal',
    isi: 'Susun pola tema sekali — edukasi, produk, testimoni — lalu tekan sekali untuk menanamnya jadi slot terjadwal sebulan penuh. Tidak ada lagi kalender kosong.',
  },
  {
    ikon: 'shield-checkmark-outline',
    judul: 'Persetujuan dengan jejak',
    isi: 'Siapa mengajukan, siapa menyetujui, kapan, dan apa catatan revisinya. Tercatat permanen, dan aturannya ditegakkan di database, bukan sekadar tombol yang disembunyikan.',
  },
  {
    ikon: 'link-outline',
    judul: 'Klien menyetujui lewat satu tautan',
    isi: 'Tanpa akun, tanpa aplikasi. Tautannya terkunci ke satu rentang tanggal, punya masa berlaku, dan bisa dicabut kapan saja.',
  },
  {
    ikon: 'apps-outline',
    judul: 'Grid pratinjau feed',
    isi: 'Lihat sembilan kotak berdampingan sebelum tayang. Tukar dua kotak untuk menukar jadwalnya, dan sebaran temanya dihitung otomatis.',
  },
  {
    ikon: 'notifications-outline',
    judul: 'Pengingat di jam tayang',
    isi: 'Notifikasi masuk ke HP saat waktunya posting, lengkap dengan materinya. Ini pengingat, bukan posting otomatis — kamu tetap yang menekan tombol terbitnya.',
  },
  {
    ikon: 'color-palette-outline',
    judul: 'Pakai merek kamu sendiri',
    isi: 'Nama, logo, dan warna per ruang kerja. Data antar ruang kerja terpisah di tingkat database, bukan hanya disembunyikan di tampilan.',
  },
]

// Bagian yang jadi pembeda utama. Katalog hari penting milik aplikasi luar
// negeri berkiblat ke Amerika dan Australia; Ramadan, Idul Fitri, dan
// Harbolnas tidak ada di sana.
const HARI_PENTING = [
  { tgl: '17 Agu', nama: 'Kemerdekaan RI', warna: '#A33333' },
  { tgl: '11.11', nama: 'Harbolnas', warna: '#6B5EE0' },
  { tgl: '12.12', nama: 'Harbolnas', warna: '#6B5EE0' },
  { tgl: '22 Des', nama: 'Hari Ibu', warna: '#B4467F' },
  { tgl: '21 Apr', nama: 'Hari Kartini', warna: '#B4467F' },
  { tgl: '2 Okt', nama: 'Hari Batik', warna: '#9A5B0E' },
  { tgl: '—', nama: 'Awal Ramadan', warna: '#1F7A55' },
  { tgl: '—', nama: 'Idul Fitri', warna: '#1F7A55' },
]

const LANGKAH = [
  { nomor: '01', judul: 'Buat ruang kerja', isi: 'Isi nama brand, pilih warna, tentukan titik awal content pillar. Satu menit, tanpa kartu kredit.' },
  { nomor: '02', judul: 'Undang tim', isi: 'Kirim tautan undangan, tentukan siapa admin dan siapa staff. Masing-masing dapat dashboard sesuai perannya.' },
  { nomor: '03', judul: 'Mulai dari satu konten', isi: 'Tulis judulnya, isi briefnya, tentukan tanggalnya. Atau tanam satu strategi sekaligus untuk sebulan penuh.' },
]

const BELUM_ADA = [
  {
    judul: 'Posting otomatis ke sosial media',
    isi: 'Butuh izin resmi dari Meta dan TikTok yang belum kami punya. Sebagai gantinya, pengingat masuk ke HP di jam tayang dan kamu yang memposting.',
  },
  {
    judul: 'Tarikan angka follower dan engagement otomatis',
    isi: 'Untuk sekarang dicatat manual, dan grafiknya tumbuh dari catatan itu.',
  },
  {
    judul: 'AI pembuat caption',
    isi: 'Belum ada. Kami tidak menjanjikan tanggalnya, karena janji yang meleset lebih mahal daripada fitur yang belum ada.',
  },
]

const FAQ = [
  {
    t: 'Apakah ini gratis?',
    j: 'Selama masa awal ini gratis dan bisa dipakai penuh. Kalau nanti ada paket berbayar, pengguna yang sudah bergabung akan diberi tahu lebih dulu, bukan tiba-tiba terkunci.',
  },
  {
    t: 'Bisa dipakai agensi yang memegang banyak klien?',
    j: 'Bisa, dan memang itu salah satu alasan aplikasi ini dibangun. Tiap klien jadi ruang kerja terpisah dengan nama, logo, dan warnanya sendiri. Data antar ruang kerja benar-benar terpisah.',
  },
  {
    t: 'Klien saya harus bikin akun?',
    j: 'Tidak. Kamu kirim satu tautan, klien membukanya di peramban mana pun dan bisa langsung menyetujui atau minta perbaikan. Tautannya terkunci ke rentang tanggal yang kamu pilih dan bisa dicabut kapan saja.',
  },
  {
    t: 'Datanya aman?',
    j: 'Tiap ruang kerja terisolasi di tingkat database, bukan hanya disembunyikan di tampilan. Anggota satu ruang kerja tidak bisa membaca data ruang kerja lain meski mencoba lewat jalur teknis. Materi yang diunggah disimpan di penyimpanan tertutup dan hanya bisa dibuka lewat tautan yang kedaluwarsa sendiri.',
  },
  {
    t: 'Bisa dipasang di HP?',
    j: 'Bisa. Buka plannersm.co di HP, lalu pilih tambahkan ke layar utama. Setelah itu ia terbuka seperti aplikasi biasa, tanpa bilah alamat, dan bisa mengirim notifikasi pengingat.',
  },
  {
    t: 'Kalau saya bekerja sendiri?',
    j: 'Tetap masuk akal. Brief, kalender, strategi, dan grid pratinjau sama bergunanya untuk satu orang. Undang tim kapan saja kalau nanti bertambah.',
  },
]

// ---------------------------------------------------------------------------
// Komponen kecil
// ---------------------------------------------------------------------------

// Kotak penanda untuk foto yang belum ada.
//
// Sengaja dibiarkan kosong dan diberi label, bukan diisi gambar pinjaman
// dari internet. Gambar orang lain di halaman jualan sendiri adalah masalah
// yang baru terasa belakangan, dan kotak kosong yang jelas justru lebih
// mudah dicari saat fotonya sudah siap.
function Foto({ label, rasio = '16 / 9', tinggi }) {
  return (
    <div className="lp-foto" style={{ aspectRatio: tinggi ? undefined : rasio, height: tinggi }}>
      <Icon name="image-outline" size={22} />
      <span>{label}</span>
    </div>
  )
}

function Pita({ children }) {
  // Teks berjalan. Isinya digandakan supaya sambungannya tidak terlihat
  // saat animasinya berulang.
  const isi = Array.from({ length: 4 }, (_, i) => (
    <span key={i}>{children}<span className="lp-pita-titik">•</span></span>
  ))
  return (
    <div className="lp-pita" aria-hidden="true">
      <div className="lp-pita-jalan">{isi}{isi}</div>
    </div>
  )
}

function Tombol({ to, children, varian = 'terang', besar = false }) {
  return (
    <Link to={to} className={`lp-pil lp-pil-${varian}${besar ? ' lp-pil-besar' : ''}`}>
      {children}
    </Link>
  )
}

// ---------------------------------------------------------------------------

export default function Landing() {
  const [faqTerbuka, setFaqTerbuka] = useState(null)
  const [menuTerbuka, setMenuTerbuka] = useState(false)

  // Halaman ini publik dan tidak terikat ruang kerja mana pun, jadi warna
  // aksennya dikembalikan ke warna bawaan plannersm.co. Tanpa ini, warna
  // merek ruang kerja yang terakhir dibuka ikut terbawa ke halaman depan.
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', '#6B5EE0')
  }, [])

  return (
    <div className="lp">
      {/* ---------------- Navigasi ---------------- */}
      <header className="lp-nav">
        <Link to="/" className="lp-logo">plannersm<span>.co</span></Link>

        <nav className="lp-nav-links">
          <a href="#masalah">Masalah</a>
          <a href="#fitur">Fitur</a>
          <a href="#lokal">Kalender Indonesia</a>
          <a href="#tanya">Tanya jawab</a>
        </nav>

        <div className="lp-nav-cta">
          <Link to="/login" className="lp-nav-masuk">Masuk</Link>
          <Tombol to="/signup" varian="gelap">Mulai gratis</Tombol>
        </div>

        <button
          type="button"
          className="lp-nav-toggle"
          onClick={() => setMenuTerbuka((v) => !v)}
          aria-label="Buka menu"
          aria-expanded={menuTerbuka}
        >
          <Icon name={menuTerbuka ? 'close-outline' : 'menu-outline'} size={22} />
        </button>
      </header>

      {menuTerbuka && (
        <div className="lp-nav-mobile">
          <a href="#masalah" onClick={() => setMenuTerbuka(false)}>Masalah</a>
          <a href="#fitur" onClick={() => setMenuTerbuka(false)}>Fitur</a>
          <a href="#lokal" onClick={() => setMenuTerbuka(false)}>Kalender Indonesia</a>
          <a href="#tanya" onClick={() => setMenuTerbuka(false)}>Tanya jawab</a>
          <Link to="/login">Masuk</Link>
          <Tombol to="/signup" varian="gelap">Mulai gratis</Tombol>
        </div>
      )}

      {/* ---------------- Hero ---------------- */}
      <section className="lp-hero">
        <div className="lp-hero-foto">
          <Foto label="Foto utama — tim sedang merencanakan konten" tinggi="100%" />
        </div>

        <div className="lp-hero-isi">
          <p className="lp-mata">Perencana konten untuk tim media sosial</p>
          <h1 className="lp-judul-besar">
            Rencana kontennya jelas,<br />
            timnya tidak lagi menebak.
          </h1>
          <p className="lp-hero-sub">
            Brief, jadwal, persetujuan, dan materinya berada di satu tempat —
            bersama kontennya, bukan tercecer di chat. Dibuat untuk tim media
            sosial dan agensi di Indonesia.
          </p>

          <div className="lp-hero-aksi">
            <Tombol to="/signup" varian="terang" besar>Mulai gratis</Tombol>
            <a href="#fitur" className="lp-pil lp-pil-garis lp-pil-besar">Lihat fiturnya</a>
          </div>

          <p className="lp-hero-nota">Tanpa kartu kredit. Bisa dipasang ke layar utama HP.</p>
        </div>

        <div className="lp-angka">
          {ANGKA.map((a) => (
            <div key={a.label} className="lp-angka-sel">
              <p className="lp-angka-nilai">{a.angka}</p>
              <p className="lp-angka-label">{a.label}</p>
            </div>
          ))}
        </div>
      </section>

      <Pita>PERENCANA KONTEN UNTUK TIM MEDIA SOSIAL DAN AGENSI</Pita>

      {/* ---------------- Masalah ---------------- */}
      <section className="lp-seksi lp-terang" id="masalah">
        <div className="lp-wadah">
          <div className="lp-kepala">
            <p className="lp-mata lp-mata-gelap">Kenapa ini dibuat</p>
            <h2 className="lp-h2">Kalau ini terasa familier</h2>
            <p className="lp-h2-sub">
              Empat hal yang muncul berulang di hampir semua tim yang mengurus
              media sosial, sekecil apa pun timnya.
            </p>
          </div>

          <div className="lp-grid-2">
            {MASALAH.map((m) => (
              <div key={m.judul} className="lp-kartu-masalah">
                <span className="lp-kartu-ikon">
                  <Icon name={m.ikon} size={19} />
                </span>
                <div>
                  <h3>{m.judul}</h3>
                  <p>{m.isi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Dua jalur ---------------- */}
      <section className="lp-seksi lp-gelap">
        <div className="lp-wadah">
          <div className="lp-kepala">
            <p className="lp-mata">Untuk siapa</p>
            <h2 className="lp-h2">Dua cara memakainya</h2>
          </div>

          <div className="lp-jalur">
            {JALUR.map((j) => (
              <article key={j.label} className="lp-jalur-kartu">
                <Foto label={`Tangkapan layar — ${j.label}`} rasio="4 / 3" />
                <p className="lp-jalur-label">{j.label}</p>
                <h3>{j.judul}</h3>
                <p className="lp-jalur-isi">{j.isi}</p>
                <ul className="lp-jalur-poin">
                  {j.poin.map((p) => (
                    <li key={p}>
                      <Icon name="checkmark-outline" size={14} /> {p}
                    </li>
                  ))}
                </ul>
                <Tombol to="/signup" varian="terang">Mulai gratis</Tombol>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Fitur ---------------- */}
      <section className="lp-seksi lp-terang" id="fitur">
        <div className="lp-wadah">
          <div className="lp-kepala">
            <p className="lp-mata lp-mata-gelap">Isinya</p>
            <h2 className="lp-h2">Yang sudah bisa kamu pakai hari ini</h2>
            <p className="lp-h2-sub">
              Semua yang tertulis di bawah sudah jalan. Yang belum ada
              disebutkan terpisah, lebih ke bawah, tanpa dibungkus kalimat
              manis.
            </p>
          </div>

          <div className="lp-fitur-utama">
            <Foto label="Tangkapan layar — layar susun konten dengan pratinjau feed" rasio="16 / 9" />
          </div>

          <div className="lp-grid-fitur">
            {FITUR.map((f) => (
              <div key={f.judul} className="lp-kartu-fitur">
                <span className="lp-kartu-ikon lp-kartu-ikon-ungu">
                  <Icon name={f.ikon} size={18} />
                </span>
                <h3>{f.judul}</h3>
                <p>{f.isi}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Pembeda lokal ---------------- */}
      <section className="lp-seksi lp-gelap" id="lokal">
        <div className="lp-wadah lp-lokal">
          <div>
            <p className="lp-mata">Yang tidak dimiliki aplikasi luar</p>
            <h2 className="lp-h2">
              Kalendernya sudah tahu<br />kapan Harbolnas dan Lebaran
            </h2>
            <p className="lp-h2-sub">
              Aplikasi perencana konten dari luar negeri mengisi kalendernya
              dengan hari besar Amerika dan Australia. Ramadan, Idul Fitri,
              Kemerdekaan, dan Harbolnas tidak ada di sana — padahal justru
              tanggal-tanggal itu yang menentukan kalender konten di sini.
            </p>
            <p className="lp-h2-sub">
              Tiga puluh dua tanggal penting sudah terisi sejak hari pertama.
              Hari besar Islam ditandai sebagai perkiraan, karena tanggal
              resminya ditetapkan sidang isbat dan bisa bergeser sehari —
              menampilkannya seolah pasti hanya akan membuat orang
              menjadwalkan konten di hari yang salah.
            </p>
            <Tombol to="/signup" varian="terang">Lihat kalendernya</Tombol>
          </div>

          <div className="lp-lokal-kartu">
            {HARI_PENTING.map((h) => (
              <div key={h.nama + h.tgl} className="lp-hari">
                <span className="lp-hari-titik" style={{ background: h.warna }} />
                <span className="lp-hari-tgl">{h.tgl}</span>
                <span className="lp-hari-nama">{h.nama}</span>
              </div>
            ))}
            <p className="lp-hari-nota">
              Ditambah kegiatan yang bukan postingan: jadwal syuting,
              peluncuran, dan tenggat laporan ke klien.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- Langkah ---------------- */}
      <section className="lp-seksi lp-terang">
        <div className="lp-wadah">
          <div className="lp-kepala">
            <p className="lp-mata lp-mata-gelap">Cara mulai</p>
            <h2 className="lp-h2">Tiga langkah, selesai dalam lima menit</h2>
          </div>

          <div className="lp-langkah">
            {LANGKAH.map((l) => (
              <div key={l.nomor} className="lp-langkah-sel">
                <p className="lp-langkah-nomor">{l.nomor}</p>
                <h3>{l.judul}</h3>
                <p>{l.isi}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Yang belum ada ---------------- */}
      <section className="lp-seksi lp-abu">
        <div className="lp-wadah">
          <div className="lp-kepala">
            <p className="lp-mata lp-mata-gelap">Terus terang</p>
            <h2 className="lp-h2">Yang belum ada</h2>
            <p className="lp-h2-sub">
              Bagian ini biasanya tidak ditulis di halaman jualan. Kami
              menulisnya supaya kamu tidak mendaftar sambil mengharapkan
              sesuatu yang belum kami punya.
            </p>
          </div>

          <div className="lp-belum">
            {BELUM_ADA.map((b) => (
              <div key={b.judul} className="lp-belum-sel">
                <Icon name="remove-circle-outline" size={18} />
                <div>
                  <h3>{b.judul}</h3>
                  <p>{b.isi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Tanya jawab ---------------- */}
      <section className="lp-seksi lp-terang" id="tanya">
        <div className="lp-wadah lp-wadah-sempit">
          <div className="lp-kepala">
            <p className="lp-mata lp-mata-gelap">Tanya jawab</p>
            <h2 className="lp-h2">Yang paling sering ditanyakan</h2>
          </div>

          <div className="lp-faq">
            {FAQ.map((f, i) => (
              <div key={f.t} className={`lp-faq-sel${faqTerbuka === i ? ' terbuka' : ''}`}>
                <button type="button" onClick={() => setFaqTerbuka(faqTerbuka === i ? null : i)}>
                  <span>{f.t}</span>
                  <Icon name={faqTerbuka === i ? 'remove-outline' : 'add-outline'} size={18} />
                </button>
                {faqTerbuka === i && <p>{f.j}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Ajakan penutup ---------------- */}
      <section className="lp-tutup">
        <div className="lp-wadah lp-wadah-sempit">
          <h2 className="lp-judul-besar">Mulai dari satu konten.</h2>
          <p className="lp-h2-sub">
            Buat ruang kerja, undang tim, isi satu brief. Sisanya mengikuti.
          </p>
          <div className="lp-hero-aksi" style={{ justifyContent: 'center' }}>
            <Tombol to="/signup" varian="terang" besar>Mulai gratis</Tombol>
            <Link to="/login" className="lp-pil lp-pil-garis lp-pil-besar">Sudah punya akun</Link>
          </div>
        </div>
      </section>

      <footer className="lp-kaki">
        <div className="lp-wadah lp-kaki-isi">
          <Link to="/" className="lp-logo">plannersm<span>.co</span></Link>
          <p>Perencana konten untuk tim media sosial dan agensi.</p>
          <div className="lp-kaki-tautan">
            <Link to="/login">Masuk</Link>
            <Link to="/signup">Daftar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
