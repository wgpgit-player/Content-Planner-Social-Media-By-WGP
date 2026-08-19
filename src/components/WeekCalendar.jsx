import { getPlatform } from '../config/platforms'

// Ala "Upcoming Schedule" di referensi fitplan — grid 7 kolom (Minggu-Sabtu),
// tiap kolom menampilkan kartu kecil berwarna per konten yang dijadwalkan
// hari itu, warna kartu mengikuti warna platform (config/platforms.js).

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

function buildWeekDates(startIso) {
  const start = new Date(startIso + 'T00:00:00')
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export default function WeekCalendar({ startIso, itemsByDate }) {
  const today = isoDate(new Date())
  const weekDates = buildWeekDates(startIso)

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 16, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontWeight: 500, fontSize: 13.5, margin: 0 }}>Jadwal minggu ini</p>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {weekDates[0].getDate()} - {weekDates[6].getDate()} {weekDates[6].toLocaleDateString('id-ID', { month: 'short' })}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 8 }}>
        {weekDates.map((d, i) => {
          const iso = isoDate(d)
          const items = itemsByDate[iso] ?? []
          const isToday = iso === today
          return (
            <div key={iso}>
              <div style={{
                textAlign: 'center', marginBottom: 8, padding: '6px 0', borderRadius: 8,
                background: isToday ? 'var(--accent)' : 'transparent',
                color: isToday ? '#fff' : 'var(--text-secondary)',
              }}>
                <p style={{ fontSize: 10, margin: 0, opacity: 0.85 }}>{DAY_LABELS[i]}</p>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{d.getDate()}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minHeight: 40 }}>
                {items.slice(0, 3).map((it) => {
                  const p = getPlatform(it.platform)
                  return (
                    <div
                      key={it.id}
                      title={it.title}
                      style={{
                        fontSize: 9.5, padding: '4px 5px', borderRadius: 6, background: p.bg, color: p.color,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'default',
                      }}
                    >
                      {it.title}
                    </div>
                  )
                })}
                {items.length > 3 && (
                  <p style={{ fontSize: 9.5, color: 'var(--text-muted)', margin: 0, paddingLeft: 3 }}>+{items.length - 3} lagi</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
