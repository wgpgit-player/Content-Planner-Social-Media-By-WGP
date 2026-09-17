import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useTenant } from '../lib/useTenant'
import { isoDate } from '../lib/dates'
import AppShell from '../components/AppShell'
import Icon from '../components/Icon'

// KPI.
//
// Sebelumnya halaman ini membaca tabel kpi_metrics yang tidak pernah terisi,
// dan targetnya ditulis tetap di dalam kode sehingga semua workspace melihat
// angka yang sama tanpa bisa mengubahnya. Praktis halaman ini selalu kosong.
//
// Sekarang targetnya milik tiap workspace, disimpan di tabel kpi_targets per
// bulan, sementara pencapaiannya dihitung dari data yang memang sudah ada:
// konten yang tayang, konten yang dijadwalkan, dan brief yang sudah diisi.
// Tidak ada angka yang dikarang.

const METRIK = [
  {
    key: 'published_per_month',
    label: 'Konten tayang',
    satuan: 'konten',
    bawaan: 12,
    keterangan: 'Jumlah konten berstatus Tayang dengan tanggal di bulan ini.',
  },
  {
    key: 'scheduled_per_month',
    label: 'Konten terjadwal',
    satuan: 'konten',
    bawaan: 16,
    keterangan: 'Konten yang sudah punya tanggal tayang di bulan ini, apa pun statusnya.',
  },
  {
    key: 'briefed_per_month',
    label: 'Konten ber-brief',
    satuan: 'konten',
    bawaan: 16,
    keterangan: 'Konten bulan ini yang briefnya sudah diisi, bukan hanya judul.',
  },
]

function awalBulanIni() {
  const d = new Date()
  return isoDate(new Date(d.getFullYear(), d.getMonth(), 1))
}

function akhirBulanIni() {
  const d = new Date()
  return isoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

function KartuKpi({ metrik, capaian, target, onUbahTarget, menyimpan }) {
  const persen = target > 0 ? Math.min(100, Math.round((capaian / target) * 100)) : 0
  const tercapai = target > 0 && capaian >= target
  const warna = tercapai ? 'var(--success)' : persen >= 60 ? 'var(--accent)' : 'var(--warning)'

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>{metrik.label}</p>
          <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{metrik.keterangan}</p>
        </div>
        {tercapai && <Icon name="checkmark-circle-outline" size={18} color="var(--success)" />}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 9 }}>
        <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: warna }}>{capaian}</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>dari {target} {metrik.satuan}</span>
      </div>

      <div className="bar-track" style={{ height: 7 }}>
        <div className="bar-fill" style={{ width: `${persen}%`, background: warna }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 13 }}>
        <label className="field-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Target bulan ini</label>
        <input
          className="input"
          type="number"
          min="0"
          value={target}
          disabled={menyimpan}
          onChange={(e) => onUbahTarget(metrik.key, e.target.value)}
          style={{ width: 88, padding: '5px 8px', fontSize: 12.5 }}
        />
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginLeft: 'auto' }}>{persen}%</span>
      </div>
    </div>
  )
}

export default function Kpi() {
  const { tenantId } = useTenant()
  const [capaian, setCapaian] = useState({ published_per_month: 0, scheduled_per_month: 0, briefed_per_month: 0 })
  const [target, setTarget] = useState({})
  const [loading, setLoading] = useState(true)
  const [menyimpan, setMenyimpan] = useState(false)
  const [pesan, setPesan] = useState(null)

  const periode = awalBulanIni()

  const muat = useCallback(async () => {
    if (!supabase || !tenantId) return
    setLoading(true)

    const awal = awalBulanIni()
    const akhir = akhirBulanIni()

    const [{ data: items, error: itemErr }, { data: targetRows }] = await Promise.all([
      supabase.from('content_items').select('status,scheduled_date,brief')
        .eq('tenant_id', tenantId).gte('scheduled_date', awal).lte('scheduled_date', akhir),
      supabase.from('kpi_targets').select('metric_key,target_value')
        .eq('tenant_id', tenantId).eq('period_month', awal),
    ])

    if (itemErr) setPesan({ type: 'error', text: `Gagal memuat data: ${itemErr.message}` })

    const rows = items ?? []
    setCapaian({
      published_per_month: rows.filter((r) => r.status === 'published').length,
      scheduled_per_month: rows.length,
      briefed_per_month: rows.filter((r) => r.brief && r.brief.trim() !== '').length,
    })

    const tersimpan = Object.fromEntries((targetRows ?? []).map((t) => [t.metric_key, Number(t.target_value)]))
    setTarget(Object.fromEntries(METRIK.map((m) => [m.key, tersimpan[m.key] ?? m.bawaan])))
    setLoading(false)
  }, [tenantId])

  useEffect(() => { muat() }, [muat])

  // Target disimpan saat pengguna berhenti mengetik, bukan pada setiap
  // ketukan, supaya tidak membanjiri server dengan permintaan.
  useEffect(() => {
    if (loading || !tenantId || !supabase) return
    const timer = setTimeout(async () => {
      setMenyimpan(true)
      const baris = METRIK.map((m) => ({
        tenant_id: tenantId,
        period_month: periode,
        metric_key: m.key,
        target_value: Number(target[m.key]) || 0,
      }))
      const { error } = await supabase
        .from('kpi_targets')
        .upsert(baris, { onConflict: 'tenant_id,period_month,metric_key' })
      setMenyimpan(false)
      if (error) setPesan({ type: 'error', text: `Gagal menyimpan target: ${error.message}` })
    }, 700)
    return () => clearTimeout(timer)
  }, [target, tenantId, periode, loading])

  function ubahTarget(key, nilai) {
    setPesan(null)
    setTarget((t) => ({ ...t, [key]: nilai === '' ? 0 : Math.max(0, Number(nilai)) }))
  }

  const namaBulan = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <AppShell
      title="KPI"
      description={`Target dan pencapaian untuk ${namaBulan}.`}
      maxWidth={820}
    >
      {pesan && (
        <p className="alert alert-error" style={{ marginBottom: 14 }}>{pesan.text}</p>
      )}

      {loading ? (
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Memuat KPI...</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))', gap: 12 }}>
            {METRIK.map((m) => (
              <KartuKpi
                key={m.key}
                metrik={m}
                capaian={capaian[m.key] ?? 0}
                target={target[m.key] ?? m.bawaan}
                onUbahTarget={ubahTarget}
                menyimpan={false}
              />
            ))}
          </div>

          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 14 }}>
            {menyimpan ? 'Menyimpan target...' : 'Target tersimpan otomatis dan berlaku untuk bulan ini saja.'}
          </p>
        </>
      )}
    </AppShell>
  )
}
