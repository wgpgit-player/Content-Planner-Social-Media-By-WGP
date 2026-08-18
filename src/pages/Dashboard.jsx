import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Sidebar from '../components/Sidebar'
import Hero from '../components/Hero'
import StatCard from '../components/StatCard'
import { getPlatform } from '../config/platforms'

// Data contoh dipakai selama belum connect ke Supabase (lihat catatan di
// supabaseClient.js). Begitu Fase 1 (schema + data) sudah jalan, ganti
// fetchDashboardData() di bawah supaya query ke tabel content_items,
// kpi_metrics, dst — struktur MOCK_DATA sudah dibuat mengikuti bentuk
// hasil query itu biar tinggal sambung.
const MOCK_DATA = {
  stats: [
    { icon: 'ti-file-text', value: 42, label: 'Konten bulan ini', gradient: 'linear-gradient(135deg,#7C6FF0,#B06FE0)' },
    { icon: 'ti-circle-check', value: 27, label: 'Sudah tayang', gradient: 'linear-gradient(135deg,#EC5FA0,#F0997B)' },
    { icon: 'ti-clock', value: 8, label: 'Terjadwal minggu ini', gradient: 'linear-gradient(135deg,#378ADD,#5DCAA5)' },
    { icon: 'ti-trending-up', value: 4.2, suffix: '%', label: 'Engagement rate', gradient: 'linear-gradient(135deg,#EF9F27,#F0997B)' },
  ],
  kanbanPreview: {
    draft: ['Reels tips zakat', 'Carousel wakaf'],
    review: ['Caption ramadhan'],
    scheduled: ['TikTok testimoni'],
  },
  upcoming: [
    { platform: 'instagram', title: 'Ide donasi Jumat berkah', when: 'Besok, 09.00' },
    { platform: 'tiktok', title: 'Behind the scenes tim', when: 'Kamis, 16.00' },
    { platform: 'instagram', title: 'Laporan mingguan donatur', when: 'Jumat, 10.00' },
  ],
}

function startOfWeekIso() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().slice(0, 10)
}

function endOfWeekIso() {
  const start = new Date(startOfWeekIso())
  start.setDate(start.getDate() + 6)
  return start.toISOString().slice(0, 10)
}

async function fetchDashboardData() {
  if (!supabase) return MOCK_DATA

  const now = new Date()
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [
    { data: monthItems, error: monthErr },
    { data: publishedItems, error: publishedErr },
    { data: weekItems, error: weekErr },
    { data: draftItems },
    { data: reviewItems },
    { data: scheduledItems },
    { data: upcomingItems },
  ] = await Promise.all([
    supabase.from('content_items').select('id').gte('created_at', startOfMonth),
    supabase.from('content_items').select('id').eq('status', 'published').gte('published_date', startOfMonth),
    supabase.from('content_items').select('id').eq('status', 'scheduled').gte('scheduled_date', startOfWeekIso()).lte('scheduled_date', endOfWeekIso()),
    supabase.from('content_items').select('title').eq('status', 'draft').order('updated_at', { ascending: false }).limit(5),
    supabase.from('content_items').select('title').eq('status', 'review').order('updated_at', { ascending: false }).limit(5),
    supabase.from('content_items').select('title').eq('status', 'scheduled').order('scheduled_date', { ascending: true }).limit(5),
    supabase.from('content_items').select('platform,title,scheduled_date').eq('status', 'scheduled').order('scheduled_date', { ascending: true }).limit(3),
  ])

  if (monthErr || publishedErr || weekErr) {
    console.error('fetchDashboardData error:', monthErr || publishedErr || weekErr)
  }

  // TODO Fase 2 lanjutan: engagement rate rata-rata sebaiknya dihitung dari
  // analytics_profile (kolom engagement_rate) begitu ada snapshot data asli.
  const engagementRate = 0

  return {
    stats: [
      { icon: 'ti-file-text', value: monthItems?.length ?? 0, label: 'Konten bulan ini', gradient: 'linear-gradient(135deg,#7C6FF0,#B06FE0)' },
      { icon: 'ti-circle-check', value: publishedItems?.length ?? 0, label: 'Sudah tayang', gradient: 'linear-gradient(135deg,#EC5FA0,#F0997B)' },
      { icon: 'ti-clock', value: weekItems?.length ?? 0, label: 'Terjadwal minggu ini', gradient: 'linear-gradient(135deg,#378ADD,#5DCAA5)' },
      { icon: 'ti-trending-up', value: engagementRate, suffix: '%', label: 'Engagement rate', gradient: 'linear-gradient(135deg,#EF9F27,#F0997B)' },
    ],
    kanbanPreview: {
      draft: (draftItems ?? []).map((i) => i.title),
      review: (reviewItems ?? []).map((i) => i.title),
      scheduled: (scheduledItems ?? []).map((i) => i.title),
    },
    upcoming: (upcomingItems ?? []).map((i) => ({
      platform: i.platform,
      title: i.title,
      when: i.scheduled_date ?? '',
    })),
  }
}

function KanbanColumn({ title, dotColor, items, itemBg, itemColor }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
        {title} · {items.length}
      </p>
      {items.map((item) => (
        <div key={item} className="kanban-item" style={{ background: itemBg, color: itemColor, marginBottom: 6 }}>
          {item}
        </div>
      ))}
    </div>
  )
}

function UpcomingItem({ platform, title, when }) {
  const p = getPlatform(platform)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 7, flexShrink: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: p.bg,
      }}>
        <i className={`ti ${p.icon}`} style={{ fontSize: 14, color: p.color }} aria-hidden="true" />
      </div>
      <div>
        <p style={{ fontSize: 12, margin: 0, color: 'var(--text-primary)' }}>{title}</p>
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

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: 16, display: 'grid', gridTemplateColumns: '190px 1fr', gap: 16 }}>
      <Sidebar />

      <div>
        <Hero userName="mas" onQuickAction={handleQuickAction} />

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 14 }}>
          {data.stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 12 }}>
          <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontWeight: 500, fontSize: 13.5, margin: 0 }}>Kanban ringkas</p>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Minggu ini</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
              <KanbanColumn title="Draft" dotColor="#B4B2A9" items={data.kanbanPreview.draft} itemBg="var(--surface-1)" itemColor="var(--text-primary)" />
              <KanbanColumn title="Review" dotColor="#EF9F27" items={data.kanbanPreview.review} itemBg="var(--warning-bg)" itemColor="var(--warning)" />
              <KanbanColumn title="Terjadwal" dotColor="#7C6FF0" items={data.kanbanPreview.scheduled} itemBg="var(--accent-bg)" itemColor="var(--accent)" />
            </div>
          </div>

          <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: 16 }}>
            <p style={{ fontWeight: 500, fontSize: 13.5, margin: '0 0 12px' }}>Jadwal terdekat</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {data.upcoming.map((u) => (
                <UpcomingItem key={u.title} {...u} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
