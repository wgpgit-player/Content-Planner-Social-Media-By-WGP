// Identitas penyelenggara, ditulis satu kali di sini.
//
// KENAPA TERPUSAT
//
// Nomor kontak dan nama badan usaha muncul di footer, halaman Syarat &
// Ketentuan, Kebijakan Privasi, tautan WhatsApp, dan penanda Schema.org.
// Kalau disebar di enam berkas, satu perubahan nomor telepon akan
// meninggalkan nomor lama di tempat yang terlupa — dan nomor kontak yang
// salah pada halaman legal lebih buruk daripada tidak ada sama sekali.

export const USAHA = {
  merek: 'plannersm.co',
  domain: 'https://plannersm.co',

  // Nama yang bertanggung jawab atas layanan ini.
  penyelenggara: 'World Gate Project',
  badanHukum: 'PT Wolka Group Palmedia',

  alamat: {
    baris: 'Gedung Wirausaha Lt. 1 Unit 104, Jl. H.R. Rasuna Said Kav. C-5',
    kelurahan: 'Karet, Setiabudi',
    kota: 'Jakarta Selatan',
    provinsi: 'DKI Jakarta',
    kodePos: '12920',
    negara: 'Indonesia',
  },

  email: 'halo@plannersm.co',

  // Dua bentuk sengaja: satu untuk dibaca manusia, satu untuk tautan.
  // Nomor yang cuma jadi tautan tanpa ditulis membuat orang tidak bisa
  // menyimpannya ke kontak, dan itu menurunkan kepercayaan.
  teleponTampil: '0851-1103-7992',
  teleponE164: '6285111037992',

  jamLayanan: 'Senin–Jumat, 09.00–17.00 WIB',
  waktuBalas: 'Dibalas dalam 1×24 jam kerja',
}

export function alamatSatuBaris() {
  const a = USAHA.alamat
  return `${a.baris}, ${a.kelurahan}, ${a.kota} ${a.kodePos}, ${a.negara}`
}

export function waUrl(pesan) {
  const dasar = `https://wa.me/${USAHA.teleponE164}`
  return pesan ? `${dasar}?text=${encodeURIComponent(pesan)}` : dasar
}
