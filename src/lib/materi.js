import { supabase } from './supabaseClient'

// Unggah dan tampilkan materi konten.
//
// KOMPRESI DILAKUKAN DI PERAMBAN, SEBELUM DIKIRIM
//
// Foto dari kamera ponsel sekarang berukuran 3 sampai 8 MB. Mengirimnya apa
// adanya berarti tiga hal sekaligus: kuota penyimpanan habis dalam hitungan
// ratusan berkas, unggahan lambat di jaringan seluler, dan halaman klien
// berat saat memuat sembilan gambar. Padahal yang dibutuhkan di sini cuma
// cukup besar untuk dinilai, bukan cukup besar untuk dicetak.
//
// Dikecilkan ke sisi terpanjang 1440 piksel dan kualitas 0,82 — masih tajam
// di layar mana pun, dan hasilnya biasanya 150 sampai 300 KB.
//
// BERKAS ASLINYA TIDAK DISIMPAN. Ini perlu dinyatakan terang-terangan ke
// pengguna: aplikasi ini tempat merencanakan, bukan gudang aset. Yang
// tersimpan adalah salinan untuk ditinjau.

const SISI_MAKS = 1440
const KUALITAS = 0.82
const BUCKET = 'materi'

// Batas sebelum kompresi, untuk GAMBAR. Berkas gambar di atas ini hampir
// pasti berkas desain yang terseret tidak sengaja, dan menolaknya lebih
// awal jauh lebih baik daripada membuat peramban tercekik saat memuatnya.
const BATAS_MENTAH = 25 * 1024 * 1024

// Video tidak dikompres di peramban — itu pekerjaan berat yang akan
// membekukan halaman. Jadi yang diunggah adalah berkas aslinya, dan
// batasnya harus disamakan dengan batas bucket di Supabase (100 MB, lihat
// migrasi materi_terima_video). Kalau dua angka ini berbeda, penolakannya
// terjadi di server setelah berkasnya terlanjur terkirim — pengalaman yang
// jauh lebih menyebalkan daripada ditolak sejak awal.
const BATAS_VIDEO = 100 * 1024 * 1024

export const JENIS_GAMBAR = 'image/jpeg,image/png,image/webp,image/gif'
export const JENIS_VIDEO = 'video/mp4,video/quicktime,video/webm'
export const JENIS_DITERIMA = `${JENIS_GAMBAR},${JENIS_VIDEO}`

export function jenisVideo(mime) {
  return typeof mime === 'string' && mime.startsWith('video/')
}

export function ukuranTerbaca(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function muatGambar(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Berkasnya tidak bisa dibaca sebagai gambar.')) }
    img.src = url
  })
}

async function kecilkan(file) {
  // GIF dilewati. Mengecilkannya lewat canvas hanya mengambil frame
  // pertama, jadi animasinya hilang dan yang tersisa gambar diam yang
  // membingungkan.
  if (file.type === 'image/gif') return file

  const img = await muatGambar(file)
  const skala = Math.min(1, SISI_MAKS / Math.max(img.width, img.height))

  // Sudah cukup kecil dan sudah berformat efisien: tidak ada gunanya
  // memproses ulang, dan mengompres ulang JPEG selalu menurunkan mutunya.
  if (skala === 1 && file.size < 400 * 1024) return file

  const kanvas = document.createElement('canvas')
  kanvas.width = Math.round(img.width * skala)
  kanvas.height = Math.round(img.height * skala)

  const ctx = kanvas.getContext('2d')
  ctx.drawImage(img, 0, 0, kanvas.width, kanvas.height)

  const blob = await new Promise((resolve) =>
    kanvas.toBlob(resolve, 'image/jpeg', KUALITAS)
  )

  // Kalau hasil kompresi justru lebih besar — bisa terjadi pada PNG grafis
  // datar — yang asli yang dipakai.
  if (!blob || blob.size >= file.size) return file

  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
}

// Ambil satu bingkai diam dari video, di peramban, untuk dipakai sebagai
// gambar pengganti di grid.
//
// Kenapa perlu: grid feed menampilkan gambar. Video tidak bisa ditaruh di
// sana apa adanya — memuat selusin video sekaligus akan menghabiskan kuota
// dan membuat halaman berat. Satu bingkai JPEG ~40 KB menyelesaikan itu.
//
// Bingkainya diambil dari detik ke-0,5 atau tengah video, mana yang lebih
// kecil. Bingkai pertama sering hitam atau buram karena transisi masuk.
async function ambilBingkaiVideo(file) {
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.muted = true
  video.playsInline = true

  const url = URL.createObjectURL(file)
  try {
    video.src = url
    await new Promise((selesai, gagal) => {
      video.onloadeddata = selesai
      video.onerror = () => gagal(new Error('Video tidak bisa dibaca peramban.'))
    })

    video.currentTime = Math.min(0.5, (video.duration || 1) / 2)
    await new Promise((selesai) => { video.onseeked = selesai })

    const skala = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight))
    const kanvas = document.createElement('canvas')
    kanvas.width = Math.round(video.videoWidth * skala)
    kanvas.height = Math.round(video.videoHeight * skala)
    kanvas.getContext('2d').drawImage(video, 0, 0, kanvas.width, kanvas.height)

    const blob = await new Promise((r) => kanvas.toBlob(r, 'image/jpeg', 0.8))
    return blob ? new File([blob], 'bingkai.jpg', { type: 'image/jpeg' }) : null
  } catch {
    // Sebagian format (terutama .mov dari iPhone) tidak bisa diputar di
    // semua peramban. Kalau bingkainya gagal diambil, videonya TETAP
    // diunggah — yang hilang cuma gambar pengganti di grid, dan itu bukan
    // alasan untuk menggagalkan seluruh unggahan.
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Terjemahkan penolakan dari database jadi kalimat yang berguna.
//
// Saat kuota penyimpanan habis, kebijakan RLS menolak dengan pesan
// "new row violates row-level security policy" — benar secara teknis, tapi
// tidak memberi tahu apa pun tentang apa yang terjadi atau apa yang bisa
// dilakukan. Tanpa terjemahan ini, pengguna cuma melihat kalimat itu dan
// menyimpulkan aplikasinya rusak.
function terjemahkanGalat(pesan) {
  if (!pesan) return 'Unggahan gagal.'
  if (/row-level security|violates row-level/i.test(pesan)) {
    return 'Penyimpanan workspace ini sudah penuh. Hapus media lama di Media Collections, '
      + 'atau minta admin menaikkan paketnya.'
  }
  if (/exceeded the maximum allowed size|payload too large/i.test(pesan)) {
    return 'Berkasnya melebihi batas ukuran yang diizinkan.'
  }
  if (/mime type .* is not supported|invalid_mime_type/i.test(pesan)) {
    return 'Jenis berkas ini belum didukung. Pakai JPG, PNG, WebP, GIF, MP4, MOV, atau WebM.'
  }
  return pesan
}

// Satu tempat untuk memeriksa dan menyiapkan berkas, dipakai oleh kedua
// jalur unggah di bawah. Sebelumnya pemeriksaannya ditulis dua kali, dan
// begitu video ditambahkan ke salah satunya, jalur yang lain diam-diam
// menawarkan video lalu menolaknya — persis jenis ketimpangan yang muncul
// kalau aturan yang sama hidup di dua tempat.
async function siapkanBerkas(file) {
  const adalahVideo = jenisVideo(file.type)

  if (!file.type.startsWith('image/') && !adalahVideo) {
    return { error: 'Baru gambar (JPG, PNG, WebP, GIF) dan video (MP4, MOV, WebM) yang bisa diunggah.' }
  }

  if (adalahVideo) {
    if (file.size > BATAS_VIDEO) {
      return {
        error: `Videonya ${ukuranTerbaca(file.size)}, melebihi batas 100 MB. `
          + 'Ekspor ulang dengan resolusi 1080p, atau simpan di Drive dan tempel tautannya.',
      }
    }
    // Video diunggah apa adanya; mengompresnya di peramban akan membekukan
    // halaman. Bingkai diamnya diambil terpisah oleh pemanggil.
    return { siap: file, adalahVideo: true }
  }

  if (file.size > BATAS_MENTAH) {
    return { error: `Berkasnya ${ukuranTerbaca(file.size)}, terlalu besar. Batasnya 25 MB sebelum dikecilkan.` }
  }

  try {
    return { siap: await kecilkan(file), adalahVideo: false }
  } catch (e) {
    return { error: e.message }
  }
}

export async function unggahMateri({ file, tenantId, contentItemId }) {
  if (!supabase) return { error: 'Belum tersambung ke server.' }
  if (!file) return { error: 'Tidak ada berkas yang dipilih.' }
  if (!tenantId || !contentItemId) return { error: 'Konten belum siap menerima lampiran.' }

  const { siap, adalahVideo, error: errSiap } = await siapkanBerkas(file)
  if (errSiap) return { error: errSiap }

  // Folder pertama adalah id workspace, dan itulah yang dipakai kebijakan
  // RLS di storage.objects untuk memisahkan akses antar workspace.
  const ext = (siap.name.split('.').pop() || (adalahVideo ? 'mp4' : 'jpg')).toLowerCase()
  const path = `${tenantId}/${contentItemId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, siap, {
    contentType: siap.type,
    // Nama berkasnya UUID dan tidak pernah ditimpa, jadi isinya dijamin
    // tidak berubah — aman di-cache lama di peramban. Tanpa ini tiap kali
    // tim membuka konten yang sama, videonya diunduh ulang dan memakan
    // kuota transfer keluar (batas yang justru habis lebih dulu daripada
    // kuota penyimpanan).
    cacheControl: '31536000',
    upsert: false,
  })

  if (error) return { error: terjemahkanGalat(error.message) }

  let posterPath = null
  if (adalahVideo) {
    const bingkai = await ambilBingkaiVideo(file)
    if (bingkai) {
      const p = `${tenantId}/${contentItemId}/${crypto.randomUUID()}.jpg`
      const { error: errPoster } = await supabase.storage.from(BUCKET).upload(p, bingkai, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
        upsert: false,
      })
      if (!errPoster) posterPath = p
    }
  }

  return { path, mime: siap.type, size: siap.size, posterPath }
}

// Unggah ke Media Collections — perpustakaan media yang tidak terikat satu
// konten tertentu (lihat migrasi perpustakaan_media_koleksi). Sengaja
// dipisah dari unggahMateri() di atas walau mekanismenya mirip: fungsi itu
// mensyaratkan contentItemId, sedangkan ini justru dipakai SEBELUM ada
// konten yang membutuhkannya. Menyatukan keduanya lewat parameter opsional
// hanya akan membuat pemanggilnya harus menghafal kombinasi mana yang valid.
export async function unggahMediaPerpustakaan({ file, tenantId }) {
  if (!supabase) return { error: 'Belum tersambung ke server.' }
  if (!file) return { error: 'Tidak ada berkas yang dipilih.' }
  if (!tenantId) return { error: 'Ruang kerja belum siap.' }

  const { siap, adalahVideo, error: errSiap } = await siapkanBerkas(file)
  if (errSiap) return { error: errSiap }

  const ext = (siap.name.split('.').pop() || (adalahVideo ? 'mp4' : 'jpg')).toLowerCase()
  const path = `${tenantId}/perpustakaan/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, siap, {
    contentType: siap.type,
    // Nama berkasnya UUID dan tidak pernah ditimpa, jadi isinya dijamin
    // tidak berubah — aman di-cache lama di peramban. Tanpa ini tiap kali
    // tim membuka konten yang sama, videonya diunduh ulang dan memakan
    // kuota transfer keluar (batas yang justru habis lebih dulu daripada
    // kuota penyimpanan).
    cacheControl: '31536000',
    upsert: false,
  })

  if (error) return { error: terjemahkanGalat(error.message) }

  // Bingkai diam diunggah setelah videonya berhasil naik. Kalau gagal,
  // videonya tetap tersimpan — lihat alasannya di ambilBingkaiVideo().
  let posterPath = null
  if (adalahVideo) {
    const bingkai = await ambilBingkaiVideo(file)
    if (bingkai) {
      const p = `${tenantId}/perpustakaan/${crypto.randomUUID()}.jpg`
      const { error: errPoster } = await supabase.storage.from(BUCKET).upload(p, bingkai, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
        upsert: false,
      })
      if (!errPoster) posterPath = p
    }
  }

  return { path, mime: siap.type, size: siap.size, posterPath }
}

// URL bertanda tangan untuk dipakai di dalam aplikasi. Tidak pernah
// disimpan ke database karena selalu kedaluwarsa.
export async function urlMateri(path, detik = 3600) {
  if (!supabase || !path) return null
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, detik)
  return data?.signedUrl ?? null
}

export async function hapusMateri(path) {
  if (!supabase || !path) return { error: null }
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  return { error: error?.message ?? null }
}

// Alamat gambar untuk halaman klien. Klien tidak punya sesi, jadi tanda
// tangannya dibuat Edge Function setelah token tautannya diperiksa.
export function urlMateriKlien(token, contentItemId) {
  const dasar = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
  if (!dasar) return null
  return `${dasar}/functions/v1/materi-klien?token=${encodeURIComponent(token)}&id=${encodeURIComponent(contentItemId)}`
}
