import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useTenantContext } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { useTenantMembers, namaAnggota } from '../lib/useTenantMembers'
import { useConfirm } from '../lib/useConfirm'
import Avatar from '../components/Avatar'
import { PLATFORMS, getPlatform } from '../config/platforms'
import { STATUSES, getStatus } from '../config/statuses'
import AppShell from '../components/AppShell'
import Icon from '../components/Icon'
import PanelPersetujuan from '../components/PanelPersetujuan'
import Komentar from '../components/Komentar'
import LampiranMateri from '../components/LampiranMateri'

// Halaman brief konten.
//
// Sebelum halaman ini ada, sebuah konten hanya punya judul, platform, pillar,
// dan jadwal. Orang yang mengerjakannya tetap harus bertanya "ini maksudnya
// apa, buat siapa, pesannya apa". Di sinilah pertanyaan itu dijawab, dan
// jawabannya menempel pada kontennya, bukan tercecer di chat.
//
// Semua kolom brief boleh kosong. Membuat konten harus tetap cepat; brief
// dilengkapi belakangan saat idenya sudah matang.

const KOLOM_BRIEF = [
  {
    name: 'brief',
    label: 'Ringkasan brief',
    placeholder: 'Konten ini tentang apa, dan kenapa perlu dibuat sekarang?',
    rows: 4,
  },
  {
    name: 'objective',
    label: 'Tujuan',
    placeholder: 'Apa yang diharapkan terjadi setelah orang melihat konten ini?',
    rows: 2,
  },
  {
    name: 'target_audience',
    label: 'Target audiens',
    placeholder: 'Siapa yang dituju. Makin spesifik makin mudah dikerjakan.',
    rows: 2,
  },
  {
    name: 'key_message',
    label: 'Pesan utama',
    placeholder: 'Satu kalimat yang harus nyangkut di kepala penonton.',
    rows: 2,
  },
  {
    name: 'caption',
    label: 'Draf caption',
    placeholder: 'Caption siap tempel. Boleh diisi belakangan.',
    rows: 5,
  },
  {
    name: 'cta',
    label: 'Ajakan bertindak',
    placeholder: 'Contoh: klik link di bio, simpan postingan ini, kirim DM.',
    rows: 2,
  },
  {
    name: 'hashtags',
    label: 'Hashtag',
    placeholder: '#contoh #hashtag',
    rows: 2,
  },
  {
    name: 'production_notes',
    label: 'Catatan produksi',
    placeholder: 'Durasi, rasio, aset yang dibutuhkan, lokasi, siapa yang syuting.',
    rows: 3,
  },
]

const KOSONG = {
  title: '', platform: '', pillar_id: '', status: 'idea', assignee_id: '',
  scheduled_date: '', scheduled_time: '',
  brief: '', objective: '', target_audience: '', key_message: '',
  caption: '', cta: '', hashtags: '', reference_url: '', production_notes: '',
}

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="field-label">{label}</label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}

export default function ContentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tenantId, isAdmin } = useTenantContext()
  const { user } = useAuth()
  const { members } = useTenantMembers()
  const tanya = useConfirm()

  const [form, setForm] = useState(KOSONG)
  const [pillars, setPillars] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [terhapus, setTerhapus] = useState(false)

  // Disimpan terpisah dari form, dan itu disengaja. Kolom persetujuan tidak
  // boleh ikut terkirim saat tombol "Simpan brief" ditekan: menyetujui adalah
  // tindakan tersendiri dengan aturannya sendiri di database, bukan efek
  // samping dari menyimpan teks brief.
  const [persetujuan, setPersetujuan] = useState(null)
  const [lampiran, setLampiran] = useState(null)

  const load = useCallback(async () => {
    if (!supabase || !tenantId) return
    setLoading(true)

    const [{ data: row, error: err }, { data: pillarRows }] = await Promise.all([
      supabase.from('content_items').select('*').eq('id', id).eq('tenant_id', tenantId).maybeSingle(),
      supabase.from('content_pillars').select('id,name').eq('tenant_id', tenantId).order('name'),
    ])

    setPillars(pillarRows ?? [])

    if (err) {
      setMessage({ type: 'error', text: err.message })
    } else if (!row) {
      setTerhapus(true)
    } else {
      // null diubah jadi string kosong supaya input terkendali React tidak
      // berpindah dari uncontrolled ke controlled saat data datang.
      const isi = { ...KOSONG }
      for (const k of Object.keys(KOSONG)) isi[k] = row[k] ?? ''
      setForm(isi)
      setPersetujuan({
        approval_state: row.approval_state ?? 'none',
        approved_by: row.approved_by ?? null,
        approved_at: row.approved_at ?? null,
      })
      // Lampiran disimpan terpisah dari form. LampiranMateri menulis
      // sendiri ke database saat berkasnya naik, jadi kalau ikut masuk ke
      // form ia akan tertimpa nilai lama begitu tombol "Simpan brief"
      // ditekan.
      setLampiran({
        asset_path: row.asset_path ?? null,
        asset_url: row.asset_url ?? null,
        asset_mime: row.asset_mime ?? null,
        asset_size: row.asset_size ?? null,
      })
    }
    setLoading(false)
  }, [id, tenantId])

  useEffect(() => { load() }, [load])

  function ubah(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
    setMessage(null)
  }

  async function simpan() {
    if (!form.title.trim()) {
      setMessage({ type: 'error', text: 'Judul tidak boleh kosong.' })
      return
    }

    setSaving(true)
    // Kolom kosong dikembalikan jadi null, bukan string kosong, supaya
    // pengecekan "sudah diisi atau belum" di tempat lain tetap sederhana.
    const payload = {}
    for (const [k, v] of Object.entries(form)) {
      payload[k] = typeof v === 'string' && v.trim() === '' ? null : v
    }
    payload.title = form.title.trim()

    const { error } = await supabase
      .from('content_items')
      .update(payload)
      .eq('id', id)
      .eq('tenant_id', tenantId)
    setSaving(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }
    setMessage({ type: 'success', text: 'Brief tersimpan.' })
  }

  async function hapus() {
    const yakin = await tanya.ask({
      title: 'Hapus konten ini?',
      description: 'Briefnya ikut terhapus. Tindakan ini tidak bisa dibatalkan.',
    })
    if (!yakin) return

    const { error } = await supabase.from('content_items').delete().eq('id', id).eq('tenant_id', tenantId)
    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }
    navigate('/kanban')
  }

  if (loading) {
    return <AppShell title="Brief konten"><p className="page-subtitle">Memuat...</p></AppShell>
  }

  if (terhapus) {
    return (
      <AppShell title="Konten tidak ditemukan" description="Mungkin sudah dihapus, atau ada di workspace lain.">
        <Link to="/kanban" className="btn">Kembali ke Project tracker</Link>
      </AppShell>
    )
  }

  const platform = getPlatform(form.platform)
  const status = getStatus(form.status)
  const anggotaTertugas = members.find((m) => m.user_id === form.assignee_id) ?? null

  // Seberapa lengkap briefnya, ditampilkan sebagai penanda ringan supaya
  // terlihat mana konten yang masih setengah jadi.
  const terisi = KOLOM_BRIEF.filter((k) => (form[k.name] ?? '').trim() !== '').length
  const persen = Math.round((terisi / KOLOM_BRIEF.length) * 100)

  return (
    <AppShell
      title="Brief konten"
      description="Semua yang perlu diketahui tim untuk mengerjakan konten ini."
      maxWidth={760}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-sm" onClick={() => navigate(-1)}>
            <Icon name="chevron-back-outline" size={14} /> Kembali
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={simpan} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      }
    >
      {message && (
        <p className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: 14 }}>
          {message.text}
        </p>
      )}

      <div className="card" style={{ marginBottom: 14 }}>
        <Field label="Judul konten">
          <input
            className="input"
            value={form.title}
            onChange={(e) => ubah('title', e.target.value)}
            placeholder="Judul singkat yang menjelaskan isinya"
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <Field label="Platform">
            <select className="select" value={form.platform} onChange={(e) => ubah('platform', e.target.value)}>
              {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </Field>

          <Field label="Content pillar">
            <select className="select" value={form.pillar_id ?? ''} onChange={(e) => ubah('pillar_id', e.target.value)}>
              <option value="">Belum dipilih</option>
              {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>

          <Field label="Status">
            <select className="select" value={form.status} onChange={(e) => ubah('status', e.target.value)}>
              {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </Field>

          {/* Admin bebas menugaskan ke siapa pun. Staff hanya bisa mengambil
              atau melepas tugasnya sendiri, sesuai aturan yang juga ditegakkan
              trigger di database, bukan sekadar disembunyikan di layar. */}
          <Field label="Penanggung jawab">
            {isAdmin ? (
              <select className="select" value={form.assignee_id ?? ''} onChange={(e) => ubah('assignee_id', e.target.value)}>
                <option value="">Belum ditugaskan</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>{namaAnggota(m)}</option>
                ))}
              </select>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 38 }}>
                <Avatar anggota={anggotaTertugas} size={24} />
                <span style={{ fontSize: 12.5, color: anggotaTertugas ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {anggotaTertugas ? namaAnggota(anggotaTertugas) : 'Belum ditugaskan'}
                </span>
                {form.assignee_id === user?.id ? (
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => ubah('assignee_id', '')}>
                    Lepas
                  </button>
                ) : !form.assignee_id ? (
                  <button type="button" className="btn btn-sm" onClick={() => ubah('assignee_id', user?.id ?? '')}>
                    Ambil tugas
                  </button>
                ) : null}
              </div>
            )}
          </Field>

          <Field label="Tanggal tayang">
            <input className="input" type="date" value={form.scheduled_date ?? ''} onChange={(e) => ubah('scheduled_date', e.target.value)} />
          </Field>

          <Field label="Jam tayang">
            <input className="input" type="time" value={form.scheduled_time ?? ''} onChange={(e) => ubah('scheduled_time', e.target.value)} />
          </Field>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
          <span className="chip" style={{ background: platform.bg, color: platform.color, borderColor: 'transparent' }}>
            <Icon name={platform.icon} size={12} /> {platform.label}
          </span>
          <span className="chip" style={{ background: status.bg, color: status.color, borderColor: 'transparent' }}>
            {status.label}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <Avatar anggota={anggotaTertugas} size={20} />
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Brief terisi {persen}%</span>
          </span>
        </div>
      </div>

      <LampiranMateri contentId={id} nilai={lampiran} onBerubah={load} />

      <PanelPersetujuan contentId={id} nilai={persetujuan} lampiran={lampiran} onBerubah={load} />

      <div className="card">
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>Isi brief</p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 18 }}>
          Tidak harus lengkap sekaligus. Isi yang sudah jelas dulu.
        </p>

        {KOLOM_BRIEF.map((k) => (
          <Field key={k.name} label={k.label}>
            <textarea
              className="textarea"
              rows={k.rows}
              value={form[k.name] ?? ''}
              onChange={(e) => ubah(k.name, e.target.value)}
              placeholder={k.placeholder}
              style={{ minHeight: k.rows * 22 }}
            />
          </Field>
        ))}

        <Field label="Tautan referensi" hint="Contoh konten serupa atau sumber data.">
          <input
            className="input"
            type="url"
            value={form.reference_url ?? ''}
            onChange={(e) => ubah('reference_url', e.target.value)}
            placeholder="https://"
          />
        </Field>
      </div>

      <Komentar contentId={id} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 16 }}>
        <button type="button" className="btn btn-danger btn-sm" onClick={hapus}>
          <Icon name="trash-outline" size={14} /> Hapus konten
        </button>
        <button type="button" className="btn btn-primary" onClick={simpan} disabled={saving} style={{ marginLeft: 'auto' }}>
          {saving ? 'Menyimpan...' : 'Simpan brief'}
        </button>
      </div>

      {tanya.dialog}
    </AppShell>
  )
}
