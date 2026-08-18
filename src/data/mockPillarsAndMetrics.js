import { INITIAL_PILLARS } from '../config/pillars'

// Data contoh untuk Content pillar, Performance tracker, dan KPI. Struktur
// field mengikuti tabel content_pillars, analytics_profile, analytics_content,
// dan kpi_metrics di fase1_skema_supabase.sql.

// contentCount di-mock manual per pillar (bukan dihitung dari CONTENT_ITEMS)
// karena datanya sengaja lebih besar buat simulasi "bulan ini" — begitu
// Supabase connect, ini diganti count(*) beneran dari tabel content_items.
const MOCK_CONTENT_COUNT = { Edukasi: 14, Program: 9, Campaign: 6, Testimoni: 8, 'Behind the scenes': 5, Report: 4 }

export const CONTENT_PILLARS_DETAIL = INITIAL_PILLARS.map((p) => ({
  ...p,
  contentCount: MOCK_CONTENT_COUNT[p.name] ?? 0,
}))

export const PROFILE_ANALYTICS = {
  instagram: { followers: 12480, followersGrowth: 3.2, engagementRate: 4.2, postsThisMonth: 18 },
  tiktok: { followers: 6320, followersGrowth: 5.8, engagementRate: 6.1, postsThisMonth: 9 },
}

export const TOP_CONTENT = [
  { id: 1, title: 'Reels tips zakat penghasilan', platform: 'instagram', likes: 842, comments: 56, shares: 120, reach: 15200 },
  { id: 2, title: 'TikTok testimoni donatur', platform: 'tiktok', likes: 1204, comments: 88, shares: 310, reach: 28400 },
  { id: 3, title: 'Carousel wakaf produktif', platform: 'instagram', likes: 512, comments: 34, shares: 61, reach: 9800 },
  { id: 4, title: 'Laporan mingguan donatur', platform: 'instagram', likes: 298, comments: 19, shares: 22, reach: 6100 },
]

export const KPI_METRICS = [
  { key: 'followers_growth', label: 'Pertumbuhan followers', value: 4.5, unit: '%', target: 5, trend: 'up' },
  { key: 'engagement_rate', label: 'Engagement rate', value: 4.2, unit: '%', target: 4, trend: 'up' },
  { key: 'posting_consistency', label: 'Konsistensi posting', value: 87, unit: '%', target: 90, trend: 'down' },
  { key: 'reach_avg', label: 'Rata-rata reach/post', value: 12300, unit: '', target: 15000, trend: 'down' },
]
