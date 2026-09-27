import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import FooterSitus from '../components/FooterSitus'
import { USAHA, alamatSatuBaris, waUrl } from '../config/usaha'
import '../landing-studio.css'

// Halaman Syarat & Ketentuan dan Kebijakan Privasi.
//
// CARA MENULISNYA
//
// Dua godaan dihindari di sini. Pertama, menyalin templat dari situs lain
// yang menyebut fitur yang tidak kita punya — dokumen legal yang bohong soal
// produknya justru merugikan yang menulisnya. Kedua, menulis dalam bahasa
// hukum yang tidak dimengerti siapa pun; kalau pembeli tidak paham apa yang
// dia setujui, persetujuan itu tidak berarti banyak.
//
// Jadi isinya menyebut apa adanya: pembayaran diverifikasi manusia, data
// disimpan di server Supabase di luar Indonesia, tidak ada auto-post, tidak
// ada penarikan otomatis. Semua itu benar per hari dokumen ini ditulis.
//
// CATATAN PENTING: ini disusun sebagai keterbukaan yang jujur kepada
// pengguna, bukan nasihat hukum. Sebelum melayani pelanggan dalam jumlah
// besar, sebaiknya diperiksa orang yang memang ahlinya.

const BERLAKU = '27 September 2026'

function Kerangka({ judul, ringkas, children }) {
  useEffect(() => {
    const sebelum = document.title
    document.title = `${judul} | plannersm`
    window.scrollTo(0, 0)
    return () => { document.title = sebelum }
  }, [judul])

  return (
    <div className="studio-landing legal-halaman">
      <header className="studio-nav is-scrolled">
        <Link className="studio-logo" to="/"><BrandLogo /></Link>
        <div className="studio-nav-actions">
          <Link to="/tentang">Kembali ke beranda</Link>
          <Link to="/signup" className="studio-button">Mulai gratis</Link>
        </div>
      </header>

      <main className="legal-isi">
        <p className="legal-kicker">Dokumen resmi</p>
        <h1>{judul}</h1>
        <p className="legal-ringkas">{ringkas}</p>
        <p className="legal-tanggal">Berlaku sejak {BERLAKU}</p>
        {children}

        <div className="legal-bantuan">
          <p>Ada bagian yang kurang jelas?</p>
          <a href={waUrl(`Halo, saya mau bertanya soal ${judul} plannersm.co.`)} target="_blank" rel="noopener noreferrer">
            Tanyakan ke admin
          </a>
        </div>
      </main>

      <FooterSitus />
    </div>
  )
}

/* ============================================================
   Syarat & Ketentuan
   ============================================================ */

export function SyaratKetentuan() {
  return (
    <Kerangka
      judul="Syarat & Ketentuan"
      ringkas="Aturan pemakaian layanan plannersm.co. Dengan mendaftar, kamu dianggap menyetujui isi halaman ini."
    >
      <section>
        <h2>1. Siapa penyelenggara layanan ini</h2>
        <p>
          plannersm.co diselenggarakan oleh <strong>{USAHA.penyelenggara}</strong> ({USAHA.badanHukum}),
          berkedudukan di {alamatSatuBaris()}. Kontak resmi: {USAHA.teleponTampil} (WhatsApp)
          dan {USAHA.email}.
        </p>
      </section>

      <section>
        <h2>2. Apa yang layanan ini kerjakan — dan tidak</h2>
        <p>
          plannersm.co adalah alat bantu perencanaan konten: menyusun agenda,
          menulis brief, menyimpan materi, membagi tugas, dan mengumpulkan
          persetujuan.
        </p>
        <p>
          Layanan ini <strong>tidak menerbitkan konten ke media sosial secara
          otomatis</strong> dan <strong>tidak mengambil angka performa dari
          platform mana pun</strong>. Publikasi tetap kamu lakukan sendiri lewat
          aplikasi media sosial masing-masing. Kalau yang kamu butuhkan adalah
          penjadwal yang memposting sendiri, layanan ini bukan itu.
        </p>
      </section>

      <section>
        <h2>3. Akun dan ruang kerja</h2>
        <ul>
          <li>Satu akun bisa membuat atau bergabung ke beberapa ruang kerja (workspace).</li>
          <li>Paket berlaku per ruang kerja, bukan per akun.</li>
          <li>Admin ruang kerja bertanggung jawab atas anggota yang ia undang.</li>
          <li>Jaga kerahasiaan kata sandi. Aktivitas yang terjadi lewat akunmu dianggap dilakukan olehmu.</li>
        </ul>
      </section>

      <section id="pembayaran">
        <h2>4. Pembayaran, aktivasi, dan pembatalan</h2>
        <p>
          Pembayaran dilakukan lewat QRIS ke rekening {USAHA.penyelenggara}. Prosesnya:
        </p>
        <ol>
          <li>Kamu memilih paket, lalu sistem membuat tagihan dengan tiga angka unik di belakang nominal.</li>
          <li>Kamu membayar <strong>tepat sejumlah itu</strong>, termasuk tiga angka terakhirnya. Angka tersebut yang kami pakai untuk mengenali pembayaranmu.</li>
          <li>Kamu mengunggah bukti transfer.</li>
          <li>Tim kami memeriksa secara manual, lalu mengaktifkan paketmu.</li>
        </ol>
        <p>
          <strong>Tidak ada penarikan otomatis dan tidak ada perpanjangan
          otomatis.</strong> Kartu kredit tidak pernah diminta. Paket berhenti
          dengan sendirinya saat masa berlakunya habis.
        </p>
        <p>
          Verifikasi dikerjakan manusia pada jam kerja ({USAHA.jamLayanan}), jadi
          aktivasi tidak seketika. Tagihan yang belum dibayar kedaluwarsa dalam
          24 jam dan bisa dibuat ulang.
        </p>
        <p>
          <strong>Pengembalian dana.</strong> Kalau pembayaran sudah masuk tapi
          paket tidak kami aktifkan, atau kamu terlanjur membayar dua kali, dana
          dikembalikan penuh. Kalau paket sudah aktif dan sudah kamu pakai,
          pengembalian dana untuk sisa masa berlaku dipertimbangkan kasus per
          kasus — hubungi kami dan ceritakan situasinya.
        </p>
        <p>
          Perpanjangan dihitung dari sisa masa berlaku yang ada, bukan dari
          tanggal pembayaran, jadi membayar lebih awal tidak membuatmu
          kehilangan hari.
        </p>
      </section>

      <section>
        <h2>5. Penyimpanan dan batas kapasitas</h2>
        <p>
          Tiap paket punya batas penyimpanan. Unggahan ditolak saat batasnya
          tercapai — berkas lama tidak dihapus otomatis. Pemakaian bisa kamu
          pantau kapan saja di halaman Pengaturan.
        </p>
      </section>

      <section>
        <h2>6. Isi yang kamu unggah</h2>
        <p>
          Konten, gambar, dan materi yang kamu unggah tetap milikmu. Kami tidak
          menggunakannya untuk keperluan lain, tidak menjualnya, dan tidak
          memakainya untuk melatih model apa pun.
        </p>
        <p>Yang tidak boleh diunggah: materi melanggar hukum Indonesia, materi
          yang melanggar hak cipta pihak lain, dan konten yang melibatkan anak
          secara tidak semestinya. Ruang kerja yang melanggar dapat kami
          nonaktifkan.</p>
      </section>

      <section>
        <h2>7. Ketersediaan layanan</h2>
        <p>
          Kami berusaha menjaga layanan tetap berjalan, tetapi tidak menjanjikan
          tanpa gangguan. Pemeliharaan, gangguan penyedia infrastruktur, atau
          hal di luar kendali kami dapat menyebabkan layanan tidak bisa diakses
          sementara. Simpan salinan materi pentingmu sendiri.
        </p>
      </section>

      <section>
        <h2>8. Penghentian</h2>
        <p>
          Kamu bisa berhenti kapan saja dengan tidak memperpanjang. Kami dapat
          menutup akun yang melanggar bagian 6, dengan pemberitahuan lebih dulu
          bila keadaan memungkinkan.
        </p>
      </section>

      <section>
        <h2>9. Perubahan ketentuan</h2>
        <p>
          Ketentuan ini bisa berubah seiring layanan berkembang. Perubahan yang
          berdampak besar akan kami beri tahu lewat email atau pemberitahuan di
          dalam aplikasi sebelum berlaku.
        </p>
      </section>

      <section>
        <h2>10. Hukum yang berlaku</h2>
        <p>
          Ketentuan ini tunduk pada hukum Republik Indonesia. Perselisihan
          diupayakan diselesaikan secara musyawarah terlebih dahulu.
        </p>
      </section>
    </Kerangka>
  )
}

/* ============================================================
   Kebijakan Privasi
   ============================================================ */

export function KebijakanPrivasi() {
  return (
    <Kerangka
      judul="Kebijakan Privasi"
      ringkas="Apa yang kami simpan tentang kamu, di mana disimpannya, dan apa yang bisa kamu minta."
    >
      <section>
        <h2>1. Data apa yang kami simpan</h2>
        <ul>
          <li><strong>Akun:</strong> alamat email dan nama yang kamu isi sendiri.</li>
          <li><strong>Isi kerja:</strong> rencana konten, brief, caption, komentar, dan berkas yang kamu unggah.</li>
          <li><strong>Ruang kerja:</strong> nama brand, logo, warna, dan daftar anggota.</li>
          <li><strong>Pembayaran:</strong> paket yang dibeli, nominal, dan bukti transfer yang kamu unggah.</li>
        </ul>
        <p>
          Kami <strong>tidak pernah</strong> menerima atau menyimpan nomor kartu
          kredit — pembayaran lewat QRIS terjadi sepenuhnya di aplikasi
          perbankanmu, di luar sistem kami.
        </p>
      </section>

      <section>
        <h2>2. Di mana data disimpan</h2>
        <p>
          Data disimpan pada infrastruktur <strong>Supabase</strong>, yang
          menempatkan basis data dan berkas di pusat data <strong>di luar
          wilayah Indonesia</strong>. Dengan menggunakan layanan ini kamu
          memahami bahwa datamu diproses lintas negara. Hosting aplikasi
          berjalan di Vercel.
        </p>
      </section>

      <section>
        <h2>3. Siapa yang bisa melihat isi kerjamu</h2>
        <p>
          Isi sebuah ruang kerja hanya bisa dilihat anggota ruang kerja itu.
          Pemisahan ini ditegakkan di tingkat basis data, bukan hanya
          disembunyikan di tampilan.
        </p>
        <p>
          Operator platform dapat melihat data langganan — nama ruang kerja,
          paket, pemakaian penyimpanan, dan riwayat pembayaran — karena itu yang
          diperlukan untuk menjalankan layanan. Operator <strong>tidak dapat
          membaca isi konten, caption, brief, maupun berkas materimu.</strong>
        </p>
      </section>

      <section>
        <h2>4. Tautan review klien</h2>
        <p>
          Kalau kamu membuat tautan review, siapa pun yang memegang tautan itu
          bisa melihat konten yang kamu bagikan di dalamnya, tanpa perlu akun.
          Tautan bisa dibatasi rentang tanggalnya, diberi masa berlaku, dan
          dicabut kapan saja. Bagikan hanya kepada yang berhak.
        </p>
      </section>

      <section>
        <h2>5. Layanan pihak ketiga</h2>
        <ul>
          <li><strong>Supabase</strong> — basis data, autentikasi, dan penyimpanan berkas.</li>
          <li><strong>Vercel</strong> — hosting aplikasi.</li>
          <li><strong>Pemberitahuan push</strong> — hanya aktif kalau kamu mengizinkannya lewat browser.</li>
        </ul>
        <p>Kami tidak memasang iklan dan tidak menjual data ke siapa pun.</p>
      </section>

      <section>
        <h2>6. Berapa lama disimpan</h2>
        <p>
          Data disimpan selama akunmu aktif. Setelah akun ditutup atas
          permintaanmu, data ruang kerja dihapus dalam 30 hari, kecuali catatan
          pembayaran yang kami simpan lebih lama untuk keperluan pembukuan.
        </p>
      </section>

      <section>
        <h2>7. Hakmu atas datamu</h2>
        <p>Sesuai Undang-Undang Perlindungan Data Pribadi, kamu berhak:</p>
        <ul>
          <li>mengetahui data apa yang kami simpan tentangmu;</li>
          <li>memperbaiki data yang keliru;</li>
          <li>meminta salinan datamu;</li>
          <li>meminta datamu dihapus;</li>
          <li>menarik persetujuan pemrosesan data.</li>
        </ul>
        <p>
          Sampaikan permintaan ke {USAHA.email} atau {USAHA.teleponTampil}. Kami
          usahakan diproses dalam 14 hari kerja.
        </p>
      </section>

      <section>
        <h2>8. Keamanan</h2>
        <p>
          Sambungan terenkripsi (HTTPS), kata sandi tidak pernah disimpan dalam
          bentuk aslinya, dan pemisahan antar ruang kerja ditegakkan di basis
          data. Meski begitu, tidak ada sistem yang sepenuhnya kebal. Kalau
          terjadi kebocoran yang berdampak pada datamu, kami akan
          memberitahukannya.
        </p>
      </section>

      <section>
        <h2>9. Anak-anak</h2>
        <p>
          Layanan ini ditujukan untuk keperluan usaha dan tidak dimaksudkan bagi
          pengguna di bawah 18 tahun.
        </p>
      </section>

      <section>
        <h2>10. Menghubungi kami</h2>
        <p>
          {USAHA.penyelenggara} ({USAHA.badanHukum})<br />
          {alamatSatuBaris()}<br />
          {USAHA.email} · {USAHA.teleponTampil}
        </p>
      </section>
    </Kerangka>
  )
}
