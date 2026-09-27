// Mengubah QRIS statis jadi QRIS dinamis bernominal.
//
// APA YANG SEBENARNYA TERJADI
//
// Isi sebuah QRIS bukan gambar khusus, melainkan satu baris teks
// berformat EMVCo TLV: potongan-potongan "tag + panjang + nilai" yang
// disambung. Contoh potongannya:
//
//   00  02  01        -> tag 00, panjang 2, nilai "01"  (versi format)
//   01  02  11        -> tag 01, panjang 2, nilai "11"  (statis)
//   ...
//   63  04  A1B2      -> tag 63, panjang 4, nilai CRC
//
// Membuat versi bernominal berarti tiga hal:
//   1. tag 01 diubah dari "11" (statis) jadi "12" (dinamis)
//   2. tag 54 disisipkan, berisi nominal
//   3. tag 63 dihitung ulang
//
// BATAS YANG PERLU DISADARI
//
// Ini TIDAK membuat pembayaran jadi otomatis. Nominal yang tertanam cuma
// menghilangkan salah ketik; uangnya tetap masuk ke rekening merchant dan
// aplikasi ini tetap tidak diberi tahu apa pun. Aktivasi paket tetap
// lewat persetujuan operator. Otomatisasi penuh hanya mungkin lewat
// payment gateway yang mengirim webhook.

const TAG_METODE = '01'   // 11 = statis, 12 = dinamis
const TAG_NOMINAL = '54'
const TAG_CRC = '63'

// Urutan tag di QRIS tidak boleh sembarangan. Nominal (54) harus berada
// sebelum kode negara (58), dan CRC (63) selalu paling akhir.
const TAG_SEBELUM_NOMINAL = ['58', '59', '60', '61', '62', '63']

/**
 * Pecah string EMVCo jadi daftar { tag, nilai }.
 * Mengembalikan null kalau bentuknya tidak masuk akal — lebih baik
 * menolak terang-terangan daripada menghasilkan QR yang gagal dipindai.
 */
export function uraikan(payload) {
  if (typeof payload !== 'string' || payload.length < 8) return null

  const hasil = []
  let i = 0

  while (i < payload.length) {
    const tag = payload.slice(i, i + 2)
    const panjangTeks = payload.slice(i + 2, i + 4)

    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(panjangTeks)) return null

    const panjang = parseInt(panjangTeks, 10)
    const nilai = payload.slice(i + 4, i + 4 + panjang)

    // Panjang yang dijanjikan melebihi sisa teks: payload terpotong.
    if (nilai.length !== panjang) return null

    hasil.push({ tag, nilai })
    i += 4 + panjang
  }

  return hasil.length > 0 ? hasil : null
}

/** Susun kembali daftar { tag, nilai } jadi string EMVCo. */
export function susun(bagian) {
  return bagian
    .map(({ tag, nilai }) => tag + String(nilai.length).padStart(2, '0') + nilai)
    .join('')
}

/**
 * CRC16 CCITT-FALSE — polinomial 0x1021, nilai awal 0xFFFF.
 * Inilah yang dipakai QRIS di tag 63.
 */
export function crc16(teks) {
  let crc = 0xffff

  for (let i = 0; i < teks.length; i++) {
    crc ^= teks.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1)
      crc &= 0xffff
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Periksa apakah sebuah payload QRIS utuh.
 *
 * Ini bukan basa-basi. CRC yang tertulis di dalam payload dihitung oleh
 * penerbit QR-nya; kalau perhitungan kita menghasilkan angka yang sama,
 * berarti implementasi CRC di sini benar — diuji langsung dengan data
 * sungguhan, bukan dengan tebakan. Kalau berbeda, hampir pasti payload
 * yang ditempel tidak lengkap atau ada spasi yang ikut tersalin.
 */
export function periksa(payload) {
  const bersih = (payload ?? '').trim()
  const bagian = uraikan(bersih)

  if (!bagian) return { valid: false, alasan: 'Formatnya tidak dikenali sebagai QRIS.' }

  const posisiCrc = bersih.lastIndexOf(TAG_CRC + '04')
  if (posisiCrc < 0) return { valid: false, alasan: 'Tidak ada checksum (tag 63) di dalamnya.' }

  const tanpaCrc = bersih.slice(0, posisiCrc + 4)
  const crcTertulis = bersih.slice(posisiCrc + 4, posisiCrc + 8).toUpperCase()
  const crcHitung = crc16(tanpaCrc)

  if (crcTertulis !== crcHitung) {
    return {
      valid: false,
      alasan: `Checksum tidak cocok (tertulis ${crcTertulis}, seharusnya ${crcHitung}). `
        + 'Biasanya karena teksnya terpotong saat disalin.',
    }
  }

  const metode = bagian.find((b) => b.tag === TAG_METODE)?.nilai
  const namaMerchant = bagian.find((b) => b.tag === '59')?.nilai ?? null
  const kota = bagian.find((b) => b.tag === '60')?.nilai ?? null

  return {
    valid: true,
    statis: metode !== '12',
    namaMerchant,
    kota,
    sudahAdaNominal: bagian.some((b) => b.tag === TAG_NOMINAL),
  }
}

/**
 * Hasilkan payload QRIS dinamis dengan nominal tertentu.
 *
 * @param {string} payloadStatis  isi QRIS statis apa adanya
 * @param {number} nominal        rupiah, bilangan bulat
 * @returns {{ payload: string } | { error: string }}
 */
export function buatQrisDinamis(payloadStatis, nominal) {
  const cek = periksa(payloadStatis)
  if (!cek.valid) return { error: cek.alasan }

  if (!Number.isInteger(nominal) || nominal <= 0) {
    return { error: 'Nominal harus bilangan bulat lebih dari nol.' }
  }
  // Batas masuk akal. Tanpa ini, salah hitung di tempat lain bisa
  // menghasilkan QR bernominal miliaran yang terlanjur tampil ke pembeli.
  if (nominal > 100_000_000) {
    return { error: 'Nominal melebihi batas wajar.' }
  }

  const bersih = payloadStatis.trim()
  const bagian = uraikan(bersih)

  // Buang CRC lama dan nominal lama (kalau QR-nya sudah dinamis).
  const tanpa = bagian.filter((b) => b.tag !== TAG_CRC && b.tag !== TAG_NOMINAL)

  // Tandai sebagai dinamis.
  const metode = tanpa.find((b) => b.tag === TAG_METODE)
  if (metode) metode.nilai = '12'
  else tanpa.unshift({ tag: TAG_METODE, nilai: '12' })

  // Sisipkan nominal tepat sebelum tag yang harus berada sesudahnya.
  const nominalTeks = String(nominal)
  const titikSisip = tanpa.findIndex((b) => TAG_SEBELUM_NOMINAL.includes(b.tag))
  const baru = { tag: TAG_NOMINAL, nilai: nominalTeks }

  if (titikSisip >= 0) tanpa.splice(titikSisip, 0, baru)
  else tanpa.push(baru)

  // Hitung CRC atas seluruh isi termasuk "6304", lalu tempelkan.
  const tanpaCrc = susun(tanpa) + TAG_CRC + '04'
  return { payload: tanpaCrc + crc16(tanpaCrc) }
}
