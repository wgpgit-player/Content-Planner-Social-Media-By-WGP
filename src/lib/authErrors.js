// Penerjemah pesan galat autentikasi.
//
// Supabase mengembalikan pesan teknis berbahasa Inggris seperti "Invalid login
// credentials" atau "email rate limit exceeded". Sebelumnya pesan itu
// ditampilkan apa adanya ke pengguna, dan hasilnya persis seperti yang
// dikeluhkan: orang tidak tahu apa yang salah, apalagi harus berbuat apa.
//
// Di sini pesan mesin diterjemahkan jadi kalimat yang menjelaskan keadaan dan
// menyebut langkah berikutnya. Tiap kasus mengembalikan:
//   teks   : apa yang terjadi, satu kalimat
//   saran  : apa yang sebaiknya dilakukan (opsional)
//   nada   : 'error' atau 'info', karena sebagian keadaan bukan kesalahan
//            pengguna, misalnya batas pengiriman email.

const BAWAAN = {
  teks: 'Terjadi masalah saat memproses permintaan.',
  saran: 'Coba lagi sebentar lagi. Kalau terus berulang, beri tahu kami.',
  nada: 'error',
}

// Beberapa pesan Supabase menyisipkan angka detik, jadi dicari dengan pola.
function detikTunggu(pesan) {
  const cocok = /after (\d+) seconds?/i.exec(pesan)
  return cocok ? Number(cocok[1]) : null
}

export function pesanGalatAuth(err) {
  if (!err) return BAWAAN

  const mentah = String(err.message ?? err).trim()
  const kode = err.code ?? ''
  const status = err.status ?? 0
  const m = mentah.toLowerCase()

  // Gagal menghubungi server sama sekali.
  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed')) {
    return {
      teks: 'Tidak bisa terhubung ke server.',
      saran: 'Periksa koneksi internet kamu, lalu coba lagi.',
      nada: 'error',
    }
  }

  // Email ditolak karena alamatnya dianggap tidak sah. Ini yang terjadi pada
  // alamat percobaan seperti test@test.com.
  if (m.includes('is invalid') && m.includes('email address')) {
    return {
      teks: 'Alamat email itu ditolak oleh sistem.',
      saran: 'Pakai email asli yang bisa kamu buka, karena link aktivasi dikirim ke sana.',
      nada: 'error',
    }
  }

  if (m.includes('unable to validate email address') || m.includes('invalid format')) {
    return {
      teks: 'Format email belum benar.',
      saran: 'Contoh yang benar: nama@perusahaan.com',
      nada: 'error',
    }
  }

  // Batas pengiriman email. Bukan salah pengguna, jadi nadanya bukan galat.
  if (m.includes('email rate limit') || kode === 'over_email_send_rate_limit') {
    return {
      teks: 'Batas pengiriman email sudah tercapai.',
      saran: 'Ini batas dari layanan email, bukan kesalahan kamu. Tunggu sekitar satu jam sebelum mendaftar lagi.',
      nada: 'info',
    }
  }

  // Jeda keamanan antar permintaan, biasanya beberapa puluh detik.
  const detik = detikTunggu(mentah)
  if (detik !== null) {
    return {
      teks: `Tunggu ${detik} detik sebelum mencoba lagi.`,
      saran: 'Permintaan yang terlalu berdekatan ditahan sementara demi keamanan.',
      nada: 'info',
    }
  }

  if (status === 429 || m.includes('too many requests') || m.includes('rate limit')) {
    return {
      teks: 'Terlalu banyak percobaan dalam waktu singkat.',
      saran: 'Istirahat sebentar, lalu coba lagi.',
      nada: 'info',
    }
  }

  // Kombinasi email dan password tidak cocok, atau akunnya memang belum ada.
  if (m.includes('invalid login credentials') || kode === 'invalid_credentials') {
    return {
      teks: 'Email atau password salah.',
      saran: 'Pastikan emailnya benar. Kalau belum pernah daftar, buat akun dulu.',
      nada: 'error',
    }
  }

  if (m.includes('email not confirmed') || kode === 'email_not_confirmed') {
    return {
      teks: 'Akun kamu belum diaktifkan.',
      saran: 'Buka link aktivasi yang kami kirim ke emailmu, lalu masuk lagi.',
      nada: 'info',
    }
  }

  if (m.includes('already registered') || m.includes('already been registered') || kode === 'user_already_exists') {
    return {
      teks: 'Email ini sudah terdaftar.',
      saran: 'Langsung masuk saja pakai email tersebut.',
      nada: 'info',
    }
  }

  if (m.includes('password should be at least') || m.includes('password should contain')) {
    return {
      teks: 'Password belum memenuhi syarat.',
      saran: 'Gunakan minimal 6 karakter.',
      nada: 'error',
    }
  }

  if (m.includes('weak password') || kode === 'weak_password') {
    return {
      teks: 'Password terlalu mudah ditebak.',
      saran: 'Campur huruf dan angka, minimal 6 karakter.',
      nada: 'error',
    }
  }

  if (m.includes('expired') || m.includes('invalid or has expired')) {
    return {
      teks: 'Link ini sudah kedaluwarsa.',
      saran: 'Minta link baru, lalu buka segera setelah diterima.',
      nada: 'error',
    }
  }

  if (m.includes('signup is disabled') || m.includes('signups not allowed')) {
    return {
      teks: 'Pendaftaran sedang ditutup sementara.',
      saran: 'Hubungi kami kalau kamu butuh akses.',
      nada: 'info',
    }
  }

  if (status >= 500) {
    return {
      teks: 'Server sedang bermasalah.',
      saran: 'Ini dari sisi kami. Coba lagi beberapa menit lagi.',
      nada: 'error',
    }
  }

  return BAWAAN
}

// Pemeriksaan format sebelum permintaan dikirim. Bukan validasi ketat, hanya
// menyaring salah ketik yang jelas, supaya percobaan yang pasti gagal tidak
// menghabiskan jatah pengiriman email.
export function emailTerlihatBenar(email) {
  const bersih = email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(bersih)) return false
  return true
}
