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

// Batas sebelum kompresi. Berkas di atas ini hampir pasti video atau berkas
// desain yang terseret tidak sengaja, dan menolaknya lebih awal jauh lebih
// baik daripada membuat peramban tercekik saat mencoba memuatnya.
const BATAS_MENTAH = 25 * 1024 * 1024

export const JENIS_DITERIMA = 'image/jpeg,image/png,image/webp,image/gif'

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

export async function unggahMateri({ file, tenantId, contentItemId }) {
  if (!supabase) return { error: 'Belum tersambung ke server.' }
  if (!file) return { error: 'Tidak ada berkas yang dipilih.' }
  if (!tenantId || !contentItemId) return { error: 'Konten belum siap menerima lampiran.' }

  if (!file.type.startsWith('image/')) {
    return { error: 'Untuk sekarang baru gambar yang bisa dilampirkan. Untuk video, pakai kolom tautan di bawahnya.' }
  }

  if (file.size > BATAS_MENTAH) {
    return { error: `Berkasnya ${ukuranTerbaca(file.size)}, terlalu besar. Batasnya 25 MB sebelum dikecilkan.` }
  }

  let siap
  try {
    siap = await kecilkan(file)
  } catch (e) {
    return { error: e.message }
  }

  // Folder pertama adalah id workspace, dan itulah yang dipakai kebijakan
  // RLS di storage.objects untuk memisahkan akses antar workspace.
  const ext = (siap.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${tenantId}/${contentItemId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, siap, {
    contentType: siap.type,
    upsert: false,
  })

  if (error) return { error: error.message }

  return { path, mime: siap.type, size: siap.size }
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

  if (!file.type.startsWith('image/')) {
    return { error: 'Untuk sekarang baru gambar yang bisa disimpan di perpustakaan.' }
  }

  if (file.size > BATAS_MENTAH) {
    return { error: `Berkasnya ${ukuranTerbaca(file.size)}, terlalu besar. Batasnya 25 MB sebelum dikecilkan.` }
  }

  let siap
  try {
    siap = await kecilkan(file)
  } catch (e) {
    return { error: e.message }
  }

  const ext = (siap.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${tenantId}/perpustakaan/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, siap, {
    contentType: siap.type,
    upsert: false,
  })

  if (error) return { error: error.message }

  return { path, mime: siap.type, size: siap.size }
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
