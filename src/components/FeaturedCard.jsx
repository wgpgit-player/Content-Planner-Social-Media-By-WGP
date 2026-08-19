import { getPlatform } from '../config/platforms'

// Ala kartu "Traveling to Switzerland" di referensi fitplan — banner gradient
// besar dengan bentuk dekoratif, plus kartu kecil mengambang di sudut kiri
// bawah berisi detail konten unggulan (konten terdekat yang perlu perhatian).

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function formatTanggal(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export default function FeaturedCard({ item }) {
  const p = item ? getPlatform(item.platform) : null

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 18, minHeight: 210,
      background: 'linear-gradient(135deg,#7C6FF0 0%,#B06FE0 45%,#EC5FA0 100%)',
      padding: 20,
    }}>
      <div style={{ position: 'absolute', right: -40, top: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.09)' }} />
      <div style={{ position: 'absolute', right: 30, bottom: -70, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
      <div style={{ position: 'absolute', left: '38%', top: 20, width: 90, height: 90, borderRadius: 24, background: 'rgba(255,255,255,0.08)', transform: 'rotate(18deg)' }} />

      <p style={{ position: 'relative', zIndex: 1, fontSize: 11, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.85)', margin: '0 0 6px', textTransform: 'uppercase' }}>
        Konten unggulan
      </p>
      <p style={{ position: 'relative', zIndex: 1, fontSize: 22, fontWeight: 600, color: '#fff', margin: 0, maxWidth: 260, lineHeight: 1.25 }}>
        {item?.title ?? 'Belum ada konten terjadwal'}
      </p>

      {item && (
        <div style={{
          position: 'absolute', left: 18, bottom: 18, right: 18,
          background: '#fff', borderRadius: 12, padding: '11px 14px',
          display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 20px rgba(30,20,60,0.18)',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', background: p.bg,
          }}>
            <i className={`ti ${p.icon}`} style={{ fontSize: 15, color: p.color }} aria-hidden="true" />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: 12.5, fontWeight: 500, margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.pillarName ?? 'Tanpa pillar'}
            </p>
            <p style={{ fontSize: 11, margin: 0, color: 'var(--text-secondary)' }}>
              <i className="ti ti-clock" style={{ fontSize: 11, verticalAlign: -1 }} aria-hidden="true" /> {formatTanggal(item.scheduledDate)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
