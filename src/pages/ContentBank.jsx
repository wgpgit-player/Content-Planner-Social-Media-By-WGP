import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../lib/useTenant'
import { PLATFORMS } from '../config/platforms'
import AppShell from '../components/AppShell'
import Icon from '../components/Icon'

// Bank ide konten.
//
// Dua hal yang diperbaiki dari versi sebelumnya:
//
// 1. Kegagalan tidak lagi disembunyikan. Dulu setiap galat hanya dicatat ke
//    console, jadi dari sisi pengguna tombol tambah terlihat "tidak bisa"
//    tanpa penjelasan apa pun. Sekarang penyebabnya ditampilkan di layar.
//
// 2. Tombolnya dinonaktifkan dengan alasan yang jelas ketika memang belum bisa
//    dipakai, misalnya karena ruang kerja masih dimuat atau kolom ide kosong,
//    supaya tidak ada klik yang terasa hilang begitu saja.
//
// Ditambah satu hal yang sebelumnya menggantung: ide kini bisa diangkat jadi
// konten di Project tracker, yang dulu ditulis sebagai rencana tapi tidak
// pernah dibangun.

const BATAS_MUAT = 300

const STATUS = {
  open: { label: 'Belum dipakai', bg: 'var(--accent-bg)', color: 'var(--accent)' },
  used: { label: 'Sudah dipakai', bg: 'var(--success-bg)', color: 'var(--success)' },
  archived: { label: 'Diarsipkan', bg: 'var(--surface-1)', color: 'var(--text-secondary)' },
}
const URUTAN_STATUS = ['open', 'used', 'archived']

export default function ContentBank() {
  const { user } = useAuth()
  const { tenantId, loading: tenantLoading } = useTenant()
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [pillars, setPillars] = useState([])
  const [loading, setLoading] = useState(true)
  const [pesan, setPesan] = useState(null)
  const [filter, setFilter] = useState('all')

  const [ideBaru, setIdeBaru] = useState('')
  const [pillarBaru, setPillarBaru] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)

  const muat = useCallback(async () => {
    if (!supabase || !tenantId) return
    setLoading(true)

    const [{ data: pillarRows, error: pillarErr }, { data: bankRows, error: bankErr }] = await Promise.all([
      supabase.from('content_pillars').select('id,name').eq('tenant_id', tenantId).order('name'),
      supabase.from('content_bank_items').select('id,idea_text,pillar_id,status')
        .eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(BATAS_MUAT),
    ])

    const galat = pillarErr ?? bankErr
    if (galat) setPesan({ type: 'error', text: `Gagal memuat data: ${galat.message}` })

    const rows = pillarRows ?? []
    setPillars(rows)
    setPillarBaru((p) => (p === '' && rows.length > 0 ? rows[0].id : p))

    const namaPillar = Object.fromEntries(rows.map((p) => [p.id, p.name]))
    setItems((bankRows ?? []).map((r) => ({
      id: r.id,
      teks: r.idea_text,
      pillarId: r.pillar_id,
      pillar: r.pillar_id ? namaPillar[r.pillar_id] ?? null : null,
      status: r.status,
    })))
    setLoading(false)
  }, [tenantId])

  useEffect(() => { muat() }, [muat])

  const terfilter = filter === 'all' ? items : items.filter((i) => i.status === filter)

  // Alasan tombol tidak bisa dipakai, ditampilkan apa adanya ke pengguna.
  let alasanTerkunci = null
  if (!supabase) alasanTerkunci = 'Aplikasi belum tersambung ke server.'
  else if (tenantLoading) alasanTerkunci = 'Ruang kerja masih dimuat.'
  else if (!tenantId) alasanTerkunci = 'Ruang kerja tidak ditemukan. Coba muat ulang halaman.'
  else if (ideBaru.trim() === '') alasanTerkunci = 'Tulis idenya dulu.'

  async function tambahIde(e) {
    e.preventDefault()
    setPesan(null)

    if (alasanTerkunci) {
      setPesan({ type: 'error', text: alasanTerkunci })
      return
    }

    setMenyimpan(true)
    const { data, error } = await supabase
      .from('content_bank_items')
      .insert({
        tenant_id: tenantId,
        idea_text: ideBaru.trim(),
        // Pillar boleh kosong. Ruang kerja yang dibuat dengan template kosong
        // memang belum punya pillar sama sekali.
        pillar_id: pillarBaru || null,
        status: 'open',
        created_by: user?.id ?? null,
      })
      .select()
      .single()
    setMenyimpan(false)

    if (error) {
      setPesan({ type: 'error', text: `Gagal menyimpan ide: ${error.message}` })
      return
    }

    const namaPillar = Object.fromEntries(pillars.map((p) => [p.id, p.name]))
    setItems((prev) => [{
      id: data.id,
      teks: data.idea_text,
      pillarId: data.pillar_id,
      pillar: data.pillar_id ? namaPillar[data.pillar_id] ?? null : null,
      status: data.status,
    }, ...prev])
    setIdeBaru('')
  }

  async function ubahStatus(id) {
    const kini = items.find((i) => i.id === id)
    if (!kini) return
    const berikut = URUTAN_STATUS[(URUTAN_STATUS.indexOf(kini.status) + 1) % URUTAN_STATUS.length]

    const sebelum = items
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: berikut } : i)))

    const { error } = await supabase.from('content_bank_items').update({ status: berikut }).eq('id', id)
    if (error) {
      setItems(sebelum)
      setPesan({ type: 'error', text: `Gagal mengubah status: ${error.message}` })
    }
  }

  async function hapus(id) {
    const sebelum = items
    setItems((prev) => prev.filter((i) => i.id !== id))
    const { error } = await supabase.from('content_bank_items').delete().eq('id', id)
    if (error) {
      setItems(sebelum)
      setPesan({ type: 'error', text: `Gagal menghapus: ${error.message}` })
    }
  }

  // Mengangkat ide jadi konten di Project tracker, lalu langsung membuka
  // halaman briefnya. Idenya ditandai sudah dipakai supaya tidak dikerjakan dua kali.
  async function jadikanKonten(item) {
    setPesan(null)
    const { data, error } = await supabase
      .from('content_items')
      .insert({
        tenant_id: tenantId,
        title: item.teks.slice(0, 120),
        platform: PLATFORMS[0].key,
        pillar_id: item.pillarId ?? null,
        status: 'idea',
        brief: item.teks,
        created_by: user?.id ?? null,
      })
      .select()
      .single()

    if (error) {
      setPesan({ type: 'error', text: `Gagal membuat konten: ${error.message}` })
      return
    }

    await supabase.from('content_bank_items').update({ status: 'used' }).eq('id', item.id)
    navigate(`/content/${data.id}`)
  }

  return (
    <AppShell
      title="Bank ide konten"
      description="Tempat menampung ide sebelum jadi konten yang dikerjakan."
      maxWidth={760}
    >
      {pesan && (
        <p className={`alert alert-${pesan.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: 14 }}>
          {pesan.text}
        </p>
      )}

      <form onSubmit={tambahIde} className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="field-label" htmlFor="ide-baru">Ide baru</label>
            <input
              id="ide-baru"
              className="input"
              value={ideBaru}
              onChange={(e) => setIdeBaru(e.target.value)}
              placeholder="Contoh: bandingkan tiga kesalahan yang sering dilakukan pemula"
            />
          </div>

          {pillars.length > 0 && (
            <div>
              <label className="field-label" htmlFor="ide-pillar">Pillar</label>
              <select
                id="ide-pillar"
                className="select"
                value={pillarBaru}
                onChange={(e) => setPillarBaru(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="">Tanpa pillar</option>
                {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={Boolean(alasanTerkunci) || menyimpan}
            title={alasanTerkunci ?? 'Simpan ide'}
          >
            <Icon name="add-outline" size={15} />
            {menyimpan ? 'Menyimpan...' : 'Tambah'}
          </button>
        </div>

        {alasanTerkunci && ideBaru.trim() !== '' && (
          <p className="field-hint" style={{ color: 'var(--warning)' }}>{alasanTerkunci}</p>
        )}
      </form>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {['all', ...URUTAN_STATUS].map((s) => (
          <button
            key={s}
            type="button"
            className={`btn btn-sm${filter === s ? ' btn-primary' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'Semua' : STATUS[s].label}
            {s !== 'all' && ` (${items.filter((i) => i.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Memuat ide...</p>
      ) : terfilter.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <Icon name="bulb-outline" size={22} color="var(--text-muted)" />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            {items.length === 0
              ? 'Belum ada ide sama sekali. Tulis satu di atas, sependek apa pun.'
              : 'Tidak ada ide di kategori ini.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {terfilter.map((item) => {
            const s = STATUS[item.status] ?? STATUS.open
            return (
              <div
                key={item.id}
                className="card"
                style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, marginBottom: 3 }}>{item.teks}</p>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {item.pillar ?? 'Tanpa pillar'}
                  </span>
                </div>

                <button
                  type="button"
                  className="chip"
                  onClick={() => ubahStatus(item.id)}
                  title="Klik untuk mengubah status"
                  style={{ background: s.bg, color: s.color, borderColor: 'transparent', cursor: 'pointer' }}
                >
                  {s.label}
                </button>

                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => jadikanKonten(item)}
                  title="Jadikan konten di Project tracker"
                >
                  <Icon name="arrow-forward-outline" size={14} /> Jadikan konten
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => hapus(item.id)}
                  title="Hapus ide"
                >
                  <Icon name="close-outline" size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
