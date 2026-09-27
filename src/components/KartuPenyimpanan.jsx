import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useTenantContext } from '../context/TenantContext'
import Icon from './Icon'

// Kartu pemakaian penyimpanan untuk halaman Pengaturan.
//
// KENAPA INI PERLU ADA SEBELUM ADA PELANGGAN
//
// Kuota yang ditegakkan tanpa diperlihatkan itu jebakan: orang baru tahu
// batasnya saat unggahannya gagal, di tengah pekerjaan, tanpa peringatan
// apa pun sebelumnya. Kartu ini membuat angkanya terlihat sejak jauh hari.
//
// Angkanya datang dari RPC ringkasan_penyimpanan, bukan dihitung di sini —
// menghitung di sisi aplikasi berarti mengunduh daftar seluruh berkas cuma
// untuk menjumlahkan ukurannya.

function ukuran(bytes) {
  if (bytes === null || bytes === undefined) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default function KartuPenyimpanan() {
  const { tenantId } = useTenantContext()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [galat, setGalat] = useState(null)

  const muat = useCallback(async () => {
    if (!supabase || !tenantId) { setLoading(false); return }
    setLoading(true)

    const { data: hasil, error } = await supabase.rpc('ringkasan_penyimpanan', { p_tenant_id: tenantId })
    if (error) setGalat(error.message)
    else setData(hasil?.[0] ?? null)
    setLoading(false)
  }, [tenantId])

  useEffect(() => { muat() }, [muat])

  if (loading) {
    return (
      <div className="card" style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Menghitung pemakaian...</p>
      </div>
    )
  }

  if (galat) {
    return (
      <div className="card" style={{ marginBottom: 14 }}>
        <p className="alert alert-error">{galat}</p>
      </div>
    )
  }

  if (!data) return null

  const persen = Number(data.persen ?? 0)
  // Tiga tingkat, bukan dua: peringatan muncul di 75% supaya masih ada
  // waktu bertindak, bukan saat sudah mentok.
  const tingkat = persen >= 90 ? 'bahaya' : persen >= 75 ? 'waspada' : 'aman'
  const warna = tingkat === 'bahaya' ? 'var(--danger)'
    : tingkat === 'waspada' ? 'var(--warning)'
    : 'var(--accent)'

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
        <p style={{ fontSize: 14, fontWeight: 600 }}>Penyimpanan</p>
        <span className="chip" style={{ background: 'var(--accent-bg)', color: 'var(--accent)', borderColor: 'transparent' }}>
          Paket {data.paket_nama}
        </span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
        Dipakai bersama seluruh anggota workspace ini. Gambar dikecilkan
        otomatis; video tidak, jadi video yang paling cepat menghabiskannya.
      </p>

      <div className="bar-track" style={{ height: 9, marginBottom: 8 }}>
        <div
          className="bar-fill"
          style={{ width: `${Math.min(persen, 100)}%`, background: warna }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
        <strong style={{ color: warna }}>{ukuran(data.terpakai)}</strong>
        <span style={{ color: 'var(--text-muted)' }}>dari {ukuran(data.batas)}</span>
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
          sisa {ukuran(data.sisa)}
        </span>
      </div>

      {tingkat !== 'aman' && (
        <p className={`alert alert-${tingkat === 'bahaya' ? 'error' : 'info'}`} style={{ marginTop: 12 }}>
          <Icon name="alert-circle-outline" size={14} />{' '}
          {tingkat === 'bahaya'
            ? 'Penyimpanan hampir penuh. Unggahan baru akan ditolak begitu batasnya tercapai — hapus media lama, atau naikkan paket.'
            : 'Penyimpanan sudah terpakai lebih dari tiga perempat. Ada baiknya mulai membersihkan media dari konten yang sudah lama tayang.'}
        </p>
      )}

      {tingkat !== 'aman' && (
        <Link to="/bayar" className="btn btn-primary btn-block" style={{ marginTop: 10 }}>
          Naikkan paket
        </Link>
      )}
    </div>
  )
}
