import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Sidebar from '../components/Sidebar'
import Hero from '../components/Hero'
import FeaturedCard from '../components/FeaturedCard'
import WeekCalendar from '../components/WeekCalendar'
import { getPlatform } from '../config/platforms'

// Layout Dashboard direstyle ala referensi "fitplan" (lihat
// Referensi Design UI UX/referensi 5.jpg): kolom kiri = kartu unggulan +
// kalender mingguan, kolom kanan = panel sapaan (Hero) + jadwal terdekat.
// Sidebar kiri aplikasi TETAP dipertahankan (beda dari referensi yang pakai
// top nav) sesuai keputusan 19 Agustus 2026.

const MOCK_DATA = {
  featured: { title: 'Reels tips zakat harian', platform: 'instagram', pillarName: 'Edukasi', scheduledDate: null },
  weekStart: null,
  itemsByDate: {},
  upcoming: [
    { platform: 'instagram', title: 'Ide donasi Jumat berkah', when: 'Besok, 09.00' },
    { platform: 'tiktok', title: 'Behind the scenes tim', when: 'Kamis, 16.00' },
    { platform: 'instagram', title: 'Laporan mingguan donatur', when: 'Jumat, 10.00' },
  ],
}

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

function startOfWeekIso() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  // Kalender di UI mulai dari Minggu, jadi mundurkan satu hari dari Senin.
  monday.setDate(monday.getDate() - 1)
  return isoDate(monday)
}

function endOfWeekIso() {
  const start = new Date(startOfWeekIso() + 'T00:00:00')
  start.setDate(start.getDate() + 6)
  return isoDate(start)
}

async function fetchDashboardData() {
  if (!supabase) return MOCK_DATA

  const weekStart = startOfWeekIso()
  const weekEnd = endOfWeekIso()
  const todayIso = isoDate(new Date())

  const [
    { data: weekItems, error: weekErr },
    { data: pillars },
    { data: featuredRaw },
    { data: upcomingItems },
  ] = await Promise.all([
    supabase.from('content_items').select('id,title,platform,scheduled_date,pillar_id').gte('scheduled_date', weekStart).lte('scheduled_date', weekEnd),
    supabase.from('content_pillars').select('id,name'),
    supabase.from('content_items').select('id,title,platform,scheduled_date,pillar_id').eq('status', 'scheduled').gte('scheduled_date', todayIso).order('scheduled_date', { ascending: true }).limit(1),
    supabase.from('content_items').select('platform,title,scheduled_date').eq('status', 'scheduled').gte('scheduled_date', todayIso).order('scheduled_date', { ascending: true }).limit(4),
  ])

  if (weekErr) console.error('fetchDashboardData error:', weekErr)

  const pillarNameById = Object.fromEntries((pillars ?? []).map((p) => [p.id, p.name]))

  const itemsByDate = {}
  for (const it of weekItems ?? []) {
    if (!it.scheduled_date) continue
    if (!itemsByDate[it.scheduled_date]) itemsByDate[it.scheduled_date] = []
    itemsByDate[it.scheduled_date].push(it)
  }

  const f = featuredRaw?.[0]
  const featured = f
    ? { title: f.title, platform: f.platform, pillarName: pillarNameById[f.pillar_id] ?? null, scheduledDate: f.scheduled_date }
    : null

  return {
    featured,
    weekStart,
    itemsByDate,
    upcoming: (upcomingItems ?? []).map((i) => ({
      platform: i.platform,
      title: i.title,
      when: i.scheduled_date ?? '',
    })),
  }
}

function UpcomingItem({ platform, title, when }) {
  const p = getPlatform(platform)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', background: p.bg,
      }}>
        <i className={`ti ${p.icon}`} style={{ fontSize: 15, color: p.color }} aria-hidden="true" />
      </div>
      <div style={{ overflow: 'hidden' }}>
        <p style={{ fontSize: 12.5, margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</p>
        <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', margin: 0 }}>{when}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchDashboardData().then(setData)
  }, [])

  function handleQuickAction(action) {
    // Placeholder — di Fase 5.5 ini manggil Edge Function yang nyambung ke
    // Claude API, bukan cuma console.log.
    console.log('quick action:', action)
  }

  if (!data) return <p style={{ padding: 24 }}>Memuat...</p>

  const weekStart = data.weekStart ?? startOfWeekIso()

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: 16, display: 'grid', gridTemplateColumns: '190px 1fr', gap: 16 }}>
      <Sidebar />

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FeaturedCard item={data.featured} />
          <WeekCalendar startIso={weekStart} itemsByDate={data.itemsByDate} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Hero userName="mas" onQuickAction={handleQuickAction} />

          <div style={{ background: 'var(--surface-2)', borderRadius: 16, padding: 16 }}>
            <p style={{ fontWeight: 500, fontSize: 13.5, margin: '0 0 13px' }}>Jadwal terdekat</p>
            {data.upcoming.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Belum ada konten terjadwal.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {data.upcoming.map((u, i) => (
                  <UpcomingItem key={`${u.title}-${i}`} {...u} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
