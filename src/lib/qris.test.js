import test from 'node:test'
import assert from 'node:assert/strict'
import { uraikan, susun, crc16, periksa, buatQrisDinamis } from './qris.js'

// BAHAN UJI: QRIS SUNGGUHAN, BUKAN KARANGAN
//
// Dua string di bawah dibaca langsung dari QR cetak milik World Gate
// Project — satu statis, satu yang sudah diberi nominal Rp 129.000 oleh
// DANA sendiri. Keduanya membawa CRC yang dihitung penerbitnya.
//
// Itulah yang membuat berkas uji ini berarti: kalau crc16() di sini
// menghasilkan angka yang sama dengan yang dicetak DANA, berarti
// implementasinya benar menurut data produksi, bukan sekadar konsisten
// dengan asumsi sendiri.
//
// Isinya tidak rahasia — tercetak di poster yang memang dipajang umum.
const QRIS_STATIS =
  '00020101021126570011ID.DANA.WWW011893600915303544308102090354430810303UMI51440014ID.CO.QRIS.WWW0215ID10266027708970303UMI5204599953033605802ID5918World Gate Project6011Kab. Bekasi6105175116304D02D'

const QRIS_DINAMIS_DANA =
  '00020101021226570011ID.DANA.WWW011893600915003544308102090354430810303UMI51440014ID.CO.QRIS.WWW0215ID10266027708970303UMI52045999530336054061290005802ID5918World Gate Project6011Kab. Bekasi610517511621960150011ID.DANA.WWW63042B6E'

/* ---------- dasar ---------- */

test('crc16 sesuai vektor uji CCITT-FALSE yang dikenal', () => {
  // Vektor standar: CRC16/CCITT-FALSE dari "123456789" adalah 0x29B1.
  assert.equal(crc16('123456789'), '29B1')
})

test('uraikan memecah TLV dengan benar dan susun mengembalikannya utuh', () => {
  const payload = '000201' + '010211' + '5802ID' + '5303360'
  const bagian = uraikan(payload)
  assert.deepEqual(bagian, [
    { tag: '00', nilai: '01' },
    { tag: '01', nilai: '11' },
    { tag: '58', nilai: 'ID' },
    { tag: '53', nilai: '360' },
  ])
  assert.equal(susun(bagian), payload)
})

test('payload yang terpotong atau ngawur ditolak, bukan dipaksa diurai', () => {
  assert.equal(uraikan('0020AB'), null, 'panjang dijanjikan 20 tapi isinya 2')
  assert.equal(uraikan(''), null)
  assert.equal(uraikan('bukan angka'), null)
})

/* ---------- terhadap QR asli ---------- */

test('CRC buatan kita sama dengan yang dicetak DANA pada QR asli', () => {
  // Uji paling menentukan di berkas ini.
  const crcDari = (p) => {
    const i = p.lastIndexOf('6304')
    return { tertulis: p.slice(i + 4), hitung: crc16(p.slice(0, i + 4)) }
  }

  const statis = crcDari(QRIS_STATIS)
  assert.equal(statis.tertulis, 'D02D')
  assert.equal(statis.hitung, statis.tertulis, 'CRC QRIS statis harus cocok')

  const dinamis = crcDari(QRIS_DINAMIS_DANA)
  assert.equal(dinamis.tertulis, '2B6E')
  assert.equal(dinamis.hitung, dinamis.tertulis, 'CRC QRIS dinamis DANA harus cocok')
})

test('QRIS statis asli terbaca benar', () => {
  const hasil = periksa(QRIS_STATIS)
  assert.equal(hasil.valid, true)
  assert.equal(hasil.statis, true)
  assert.equal(hasil.sudahAdaNominal, false)
  assert.equal(hasil.namaMerchant, 'World Gate Project')
  assert.equal(hasil.kota, 'Kab. Bekasi')
})

test('QRIS dinamis DANA terbaca sebagai dinamis dan bernominal', () => {
  const hasil = periksa(QRIS_DINAMIS_DANA)
  assert.equal(hasil.valid, true)
  assert.equal(hasil.statis, false)
  assert.equal(hasil.sudahAdaNominal, true)
})

test('satu karakter berubah langsung ketahuan dari checksum', () => {
  const rusak = QRIS_STATIS.replace('Kab. Bekasi', 'Kab. Bekasj')
  const hasil = periksa(rusak)
  assert.equal(hasil.valid, false)
  assert.match(hasil.alasan, /Checksum tidak cocok/)
})

/* ---------- konversi ---------- */

test('hasil konversi menjadi dinamis, bernominal, dan checksum-nya sah', () => {
  const { payload } = buatQrisDinamis(QRIS_STATIS, 129910)
  const cek = periksa(payload)

  assert.equal(cek.valid, true, 'QR hasil konversi harus lolos pemeriksaan sendiri')
  assert.equal(cek.statis, false, 'tag 01 harus berubah jadi 12')
  assert.equal(cek.sudahAdaNominal, true)
  assert.equal(cek.namaMerchant, 'World Gate Project', 'merchant tidak boleh ikut berubah')

  assert.equal(uraikan(payload).find((b) => b.tag === '54').nilai, '129910')
})

test('urutan tag hasil konversi sama persis dengan buatan DANA', () => {
  // DANA menambahkan tag 62 (data tambahan miliknya) yang tidak kita
  // tiru; selain itu urutannya harus identik. Kalau suatu saat berbeda,
  // kemungkinan besar penyisipan nominalnya salah tempat.
  const kita = uraikan(buatQrisDinamis(QRIS_STATIS, 129000).payload).map((b) => b.tag)
  const dana = uraikan(QRIS_DINAMIS_DANA).map((b) => b.tag).filter((t) => t !== '62')
  assert.deepEqual(kita, dana)
})

test('nominal ditaruh sebelum kode negara, CRC tetap paling akhir', () => {
  const urutan = uraikan(buatQrisDinamis(QRIS_STATIS, 49017).payload).map((b) => b.tag)
  assert.ok(urutan.indexOf('54') < urutan.indexOf('58'), 'tag 54 harus sebelum 58')
  assert.equal(urutan[urutan.length - 1], '63', 'tag 63 harus paling akhir')
})

test('mengubah nominal dua kali tidak menumpuk tag 54', () => {
  const sekali = buatQrisDinamis(QRIS_STATIS, 10000).payload
  const dua = buatQrisDinamis(sekali, 25000).payload

  assert.equal(uraikan(dua).filter((b) => b.tag === '54').length, 1, 'tag nominal tidak boleh dobel')
  assert.equal(uraikan(dua).find((b) => b.tag === '54').nilai, '25000')
  assert.equal(periksa(dua).valid, true)
})

test('nominal tidak masuk akal ditolak, bukan dibuatkan QR-nya', () => {
  assert.ok(buatQrisDinamis(QRIS_STATIS, 0).error)
  assert.ok(buatQrisDinamis(QRIS_STATIS, -5000).error)
  assert.ok(buatQrisDinamis(QRIS_STATIS, 1500.5).error)
  assert.ok(buatQrisDinamis(QRIS_STATIS, 999_000_000).error)
})

test('QRIS rusak menghasilkan pesan kesalahan, bukan QR yang salah', () => {
  const hasil = buatQrisDinamis('00020101021126', 50000)
  assert.ok(hasil.error, 'harus menolak')
  assert.equal(hasil.payload, undefined, 'tidak boleh tetap mengembalikan payload')
})
