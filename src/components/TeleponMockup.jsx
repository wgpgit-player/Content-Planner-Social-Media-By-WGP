// Mockup telepon — kerangka saja, isinya diserahkan ke pemanggil lewat
// children. Dipisah jadi komponen sendiri karena dipakai di lebih dari satu
// tempat (Composer, Grid pratinjau) dan karena bingkai telepon punya banyak
// bagian kecil yang kalau ditulis ulang di tiap halaman pasti jadi beda-beda.
//
// SEMUA UKURAN DITURUNKAN DARI SATU ANGKA
//
// Ini bagian yang penting dan yang sebelumnya salah. Dulu tiap bagian
// (radius sudut, tebal bingkai, ukuran pulau, tinggi status bar) ditulis
// dengan angka piksel sendiri-sendiri, jadi begitu layar di-zoom atau
// lebarnya berubah, perbandingan antar bagian ikut melar tidak karuan.
//
// Sekarang hanya `lebar` yang berupa angka. Semua sisanya dihitung sebagai
// kelipatan dari --hp-w di CSS (lihat blok .hp di index.css), persis seperti
// telepon sungguhan yang perbandingan bodinya tetap berapa pun ukuran
// cetakannya. Ganti satu angka, seluruh mockup ikut menyesuaikan tanpa ada
// bagian yang bergeser sendiri.
//
// Perbandingan layar 393 : 852 mengikuti ukuran layar iPhone modern, supaya
// pratinjau feed di dalamnya benar-benar sebangun dengan yang akan dilihat
// orang di telepon aslinya.
export default function TeleponMockup({ children, lebar = 290, className = '' }) {
  return (
    <div className={`hp ${className}`} style={{ '--hp-w': `${lebar}px` }}>
      {/* Tombol fisik di sisi bodi. Murni visual — tidak bisa ditekan, dan
          memang tidak seharusnya bisa. */}
      <span className="hp-tombol hp-senyap" aria-hidden="true" />
      <span className="hp-tombol hp-vol-naik" aria-hidden="true" />
      <span className="hp-tombol hp-vol-turun" aria-hidden="true" />
      <span className="hp-tombol hp-daya" aria-hidden="true" />

      <div className="hp-layar">
        <span className="hp-pulau" aria-hidden="true" />

        <div className="hp-status" aria-hidden="true">
          <span className="hp-jam">9:41</span>
          <span className="hp-status-ikon">
            {/* Sinyal, wifi, baterai — digambar dengan elemen biasa, bukan
                ikon, supaya ikut mengecil bersama --hp-w. */}
            <span className="hp-sinyal">
              <i style={{ height: '34%' }} />
              <i style={{ height: '56%' }} />
              <i style={{ height: '78%' }} />
              <i style={{ height: '100%' }} />
            </span>
            <span className="hp-wifi" />
            <span className="hp-baterai"><i /></span>
          </span>
        </div>

        <div className="hp-isi">{children}</div>

        <span className="hp-garis-beranda" aria-hidden="true" />
      </div>
    </div>
  )
}
