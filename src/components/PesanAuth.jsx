import Icon from './Icon'

// Kotak pesan untuk halaman Masuk dan Daftar.
//
// Sebelumnya pesan galat hanya satu baris teks merah berisi kalimat teknis
// dari server. Sekarang ada tiga bagian: ikon yang menandakan seberapa serius
// keadaannya, satu kalimat tentang apa yang terjadi, dan satu kalimat tentang
// apa yang bisa dilakukan. Bagian ketiga itu yang paling sering hilang di
// pesan galat, padahal itu yang dicari orang saat kebingungan.
//
// Nada 'info' dipakai untuk keadaan yang bukan kesalahan pengguna, misalnya
// batas pengiriman email. Memerahkan layar untuk hal seperti itu membuat
// orang merasa salah padahal tidak.
export default function PesanAuth({ pesan }) {
  if (!pesan) return null

  const galat = pesan.nada !== 'info'

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        gap: 9,
        padding: '10px 12px',
        borderRadius: 10,
        marginBottom: 14,
        background: galat ? 'var(--danger-bg)' : 'var(--surface-1)',
        border: `0.5px solid ${galat ? 'transparent' : 'var(--border)'}`,
      }}
    >
      <Icon
        name={galat ? 'alert-circle-outline' : 'information-circle-outline'}
        size={16}
        color={galat ? 'var(--danger)' : 'var(--text-secondary)'}
        style={{ marginTop: 1, flexShrink: 0 }}
      />
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 12.5, fontWeight: 500, color: galat ? 'var(--danger)' : 'var(--text-primary)', lineHeight: 1.45 }}>
          {pesan.teks}
        </p>
        {pesan.saran && (
          <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>
            {pesan.saran}
          </p>
        )}
      </div>
    </div>
  )
}
