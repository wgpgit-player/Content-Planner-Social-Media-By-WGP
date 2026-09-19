// Fungsi tanggal bersama untuk seluruh aplikasi.
//
// KENAPA FILE INI ADA:
// Sebelumnya tiga file (Dashboard, WeekCalendar, ContentCalendar) masing-masing
// punya `isoDate()` sendiri yang isinya `d.toISOString().slice(0, 10)`.
// Itu keliru. toISOString() selalu mengonversi ke UTC, sedangkan Indonesia
// ada di UTC+7 — jadi tanggal lokal jam 00:00 berubah jadi tanggal SEBELUMNYA
// dalam UTC.
//
// Akibat nyatanya (terbukti saat pengujian):
//   - "Jadwal minggu ini" di dashboard mulai dari hari Sabtu, bukan Minggu,
//     dan dua hari terakhir minggu itu tidak pernah ikut ditampilkan
//   - Sebelum jam 07.00 WIB, "hari ini" terbaca sebagai hari kemarin, jadi
//     konten yang dijadwalkan hari ini tidak muncul di "Jadwal terdekat"
//
// Solusinya: bentuk string tanggal dari komponen tanggal LOKAL, jangan pernah
// lewat UTC. Kolom scheduled_date di database bertipe `date` (tanpa jam dan
// tanpa zona waktu), jadi yang dibandingkan memang harus tanggal lokal.

const pad = (n) => String(n).padStart(2, '0')

// Date → 'YYYY-MM-DD' memakai tanggal lokal.
export function isoDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 'YYYY-MM-DD' → Date pada tengah malam waktu lokal.
// Menambahkan 'T00:00:00' penting: tanpa itu, string tanggal polos justru
// diurai sebagai UTC oleh spesifikasi JavaScript, dan bug yang sama kembali.
export function parseIsoDate(iso) {
  return new Date(`${iso}T00:00:00`)
}

export function todayIso() {
  return isoDate(new Date())
}

// Hari Minggu pada minggu yang memuat tanggal `d`. Kalender di aplikasi ini
// ditampilkan Minggu-Sabtu, sesuai kebiasaan penanggalan di Indonesia.
export function startOfWeek(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  start.setDate(start.getDate() - start.getDay())
  return start
}

export function addDays(d, n) {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

// Tujuh tanggal berurutan mulai dari `start` (Minggu sampai Sabtu).
export function buildWeekDates(start) {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function isSameDay(a, b) {
  return isoDate(a) === isoDate(b)
}

// Hari ke berapa dalam setahun (1-366), dihitung dari komponen tanggal
// lokal — dipakai untuk memilih ide konten harian secara deterministik
// (lihat useAgenda.js): tanggal yang sama selalu memilih ide yang sama,
// tanpa perlu baris data per tanggal.
export function dayOfYear(d) {
  const awalTahun = new Date(d.getFullYear(), 0, 1)
  const selisihMs = new Date(d.getFullYear(), d.getMonth(), d.getDate()) - awalTahun
  return Math.floor(selisihMs / 86400000) + 1
}
