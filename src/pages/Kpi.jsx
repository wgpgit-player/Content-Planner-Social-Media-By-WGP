import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { supabase } from '../lib/supabaseClient'

// kpi_metrics belum punya kolom `target` di skema Fase 1 — cuma metric_key +
// metric_value per period. Target dipetakan di frontend per metric_key
// sampai ada kolom target di tabel (atau tabel kpi_targets terpisah).
const TARGET_BY_KEY = {
  followers_growth: 5,
  engagement_rate: 4,
  posting_consistency: 90,
  reach_avg: 15000,
}
const LABEL_BY_KEY = {
  followers_growth: 'Pertumbuhan followers',
  engagement_rate: 'Engagement rate',
  posting_consistency: 'Konsistensi posting',
  reach_avg: 'Rata-rata reach/post',
}
const UNIT_BY_KEY = {
  followers_growth: '%',
  engagement_rate: '%',
  posting_consistency: '%',
  reach_avg: '',
}

function KpiCard({ label, value, unit, target, trend }) {
  const pct = Math.min(100, Math.round((value / target) * 100))
  const isUp = trend === 'up'
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: 16 }}>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <p style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>{value.toLocaleString('id-ID')}{unit}</p>
        <span style={{ fontSize: 11, color: isUp ? '#3B6D11' : '#A32D2D', display: 'flex', alignItems: 'center', gap: 2 }}>
          <i className={`ti ${isUp ? 'ti-trending-up' : 'ti-trending-down'}`} style={{ fontSize: 12 }} aria-hidden="true" />
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--surface-1)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: isUp ? '#639922' : '#EF9F27', borderRadius: 4 }} />
      </div>
      <p style={{ fontSize: 10.5, color: 'var(--text-muted)', margin: '6px 0 0' }}>Target: {target.toLocaleString('id-ID')}{unit}</p>
    </div>
  )
}

async function fetchKpiMetrics() {
  if (!supabase) return []

  const { data: rows, error } = await supabase
    .from('kpi_metrics')
    .select('metric_key,metric_value,period_start,period_end')
    .order('period_end', { ascending: false })
  if (error) {
    console.error('fetch kpi_metrics error:', error)
    return []
  }

  // Ambil nilai terbaru dan sebelumnya per metric_key buat hitung trend naik/turun.
  const latestByKey = {}
  const previousByKey = {}
  for (const row of rows ?? []) {
    if (!latestByKey[row.metric_key]) {
      latestByKey[row.metric_key] = row
    } else if (!previousByKey[row.metric_key]) {
      previousByKey[row.metric_key] = row
    }
  }

  return Object.keys(latestByKey).map((key) => {
    const latest = latestByKey[key]
    const previous = previousByKey[key]
    const trend = previous ? (latest.metric_value >= previous.metric_value ? 'up' : 'down') : 'up'
    return {
      key,
      label: LABEL_BY_KEY[key] ?? key,
      value: latest.metric_value,
      unit: UNIT_BY_KEY[key] ?? '',
      target: TARGET_BY_KEY[key] ?? latest.metric_value,
      trend,
    }
  })
}

export default function Kpi() {
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchKpiMetrics()
      .then(setMetrics)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: 16, display: 'grid', gridTemplateColumns: '190px 1fr', gap: 16 }}>
      <Sidebar />
      <div style={{ maxWidth: 700 }}>
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>KPI</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Target vs pencapaian bulan ini</p>
        </div>
        {loading && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Memuat KPI...</p>}
        {error && <p style={{ fontSize: 12.5, color: '#A32D2D' }}>Gagal memuat data: {error.message}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
          {metrics.map((m) => (
            <KpiCard key={m.key} {...m} />
          ))}
        </div>
      </div>
    </div>
  )
}
