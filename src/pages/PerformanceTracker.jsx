import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { supabase } from '../lib/supabaseClient'
import { getPlatform } from '../config/platforms'

function ProfileCard({ platformKey, data }) {
  const platform = getPlatform(platformKey)
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: platform.bg,
        }}>
          <i className={`ti ${platform.icon}`} style={{ fontSize: 14, color: platform.color }} aria-hidden="true" />
        </div>
        <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0 }}>{platform.label}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>{data.followers.toLocaleString('id-ID')}</p>
          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', margin: 0 }}>Followers (+{data.followersGrowth}%)</p>
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>{data.engagementRate}%</p>
          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', margin: 0 }}>Engagement rate</p>
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>{data.postsThisMonth}</p>
          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', margin: 0 }}>Post bulan ini</p>
        </div>
      </div>
    </div>
  )
}

async function fetchPerformanceData() {
  if (!supabase) return { profiles: {}, topContent: [] }

  // Ambil 2 snapshot terbaru per platform (buat hitung followers growth
  // secara kasar), lalu ambil konten performa terbaik dari analytics_content.
  const [{ data: profileRows, error: profileErr }, { data: contentRows, error: contentErr }] = await Promise.all([
    supabase.from('analytics_profile').select('platform,snapshot_date,followers,engagement_rate,posts_count').order('snapshot_date', { ascending: false }),
    supabase.from('analytics_content').select('content_item_id,platform,likes,comments_count,shares,reach').order('reach', { ascending: false }).limit(10),
  ])
  if (profileErr) console.error('fetch analytics_profile error:', profileErr)
  if (contentErr) console.error('fetch analytics_content error:', contentErr)

  const profiles = {}
  for (const row of profileRows ?? []) {
    if (profiles[row.platform]) continue // sudah ada snapshot terbaru, skip yang lebih lama
    const prev = (profileRows ?? []).find((r) => r.platform === row.platform && r.snapshot_date !== row.snapshot_date)
    const followersGrowth = prev && prev.followers ? Number((((row.followers - prev.followers) / prev.followers) * 100).toFixed(1)) : 0
    profiles[row.platform] = {
      followers: row.followers ?? 0,
      followersGrowth,
      engagementRate: row.engagement_rate ?? 0,
      postsThisMonth: row.posts_count ?? 0,
    }
  }

  const contentItemIds = [...new Set((contentRows ?? []).map((r) => r.content_item_id).filter(Boolean))]
  let titleById = {}
  if (contentItemIds.length) {
    const { data: itemRows } = await supabase.from('content_items').select('id,title').in('id', contentItemIds)
    titleById = Object.fromEntries((itemRows ?? []).map((i) => [i.id, i.title]))
  }

  const topContent = (contentRows ?? []).map((row, idx) => ({
    id: row.content_item_id ?? idx,
    title: titleById[row.content_item_id] ?? '(tanpa judul)',
    platform: row.platform,
    likes: row.likes ?? 0,
    comments: row.comments_count ?? 0,
    shares: row.shares ?? 0,
    reach: row.reach ?? 0,
  }))

  return { profiles, topContent }
}

export default function PerformanceTracker() {
  const [data, setData] = useState({ profiles: {}, topContent: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPerformanceData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...data.topContent].sort((a, b) => b.reach - a.reach)
  const trackedPlatforms = Object.keys(data.profiles)

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: 16, display: 'grid', gridTemplateColumns: '190px 1fr', gap: 16 }}>
      <Sidebar />
      <div style={{ maxWidth: 780 }}>
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>Performance tracker</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Ringkasan akun dan konten dengan performa terbaik bulan ini</p>
        </div>

        {loading && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Memuat data performa...</p>}
        {error && <p style={{ fontSize: 12.5, color: '#A32D2D' }}>Gagal memuat data: {error.message}</p>}

        {trackedPlatforms.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${trackedPlatforms.length}, minmax(0,1fr))`, gap: 12, marginBottom: 16 }}>
            {trackedPlatforms.map((key) => (
              <ProfileCard key={key} platformKey={key} data={data.profiles[key]} />
            ))}
          </div>
        )}

        <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: 16 }}>
          <p style={{ fontWeight: 500, fontSize: 13.5, margin: '0 0 12px' }}>Konten terbaik</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 11 }}>
                <th style={{ fontWeight: 400, paddingBottom: 8 }}>Judul</th>
                <th style={{ fontWeight: 400, paddingBottom: 8 }}>Likes</th>
                <th style={{ fontWeight: 400, paddingBottom: 8 }}>Komentar</th>
                <th style={{ fontWeight: 400, paddingBottom: 8 }}>Share</th>
                <th style={{ fontWeight: 400, paddingBottom: 8 }}>Reach</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.id} style={{ borderTop: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '8px 0' }}>{c.title}</td>
                  <td>{c.likes.toLocaleString('id-ID')}</td>
                  <td>{c.comments}</td>
                  <td>{c.shares}</td>
                  <td>{c.reach.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
