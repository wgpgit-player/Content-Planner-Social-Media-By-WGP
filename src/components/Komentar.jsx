import { useCallback, useEffect, useState } from 'react'
import Icon from './Icon'
import Avatar from './Avatar'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import { useTenantMembers, namaAnggota } from '../lib/useTenantMembers'
import { useConfirm } from '../lib/useConfirm'

// Diskusi per konten.
//
// Tabel comments sudah ada di database sejak skema pertama dibuat, tapi
// tidak pernah punya tampilan — jadi selama ini semua pembahasan soal satu
// konten hidup di WhatsApp, terpisah dari kontennya. Masalahnya baru terasa
// beberapa minggu kemudian, saat seseorang bertanya "kenapa dulu kita
// putuskan begini" dan tidak ada yang bisa menemukan jawabannya.
//
// Sengaja tidak ada fitur ubah dan hapus komentar orang lain. Ini catatan
// yang gunanya justru karena tidak bisa diubah belakangan.

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function waktuRelatif(ts) {
  const d = new Date(ts)
  const selisihMenit = Math.floor((Date.now() - d.getTime()) / 60000)

  if (selisihMenit < 1) return 'baru saja'
  if (selisihMenit < 60) return `${selisihMenit} menit lalu`
  if (selisihMenit < 60 * 24) return `${Math.floor(selisihMenit / 60)} jam lalu`

  return `${d.getDate()} ${BULAN[d.getMonth()]} ${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`
}

export default function Komentar({ contentId }) {
  const { user } = useAuth()
  const { tenantId } = useTenantContext()
  const { members } = useTenantMembers()
  const tanya = useConfirm()

  const [daftar, setDaftar] = useState([])
  const [teks, setTeks] = useState('')
  const [loading, setLoading] = useState(true)
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState(null)

  const muat = useCallback(async () => {
    if (!supabase || !contentId) { setLoading(false); return }

    const { data, error } = await supabase
      .from('comments')
      .select('id,body,user_id,created_at')
      .eq('content_item_id', contentId)
      .order('created_at', { ascending: true })
      .limit(200)

    if (error) setGalat(error.message)
    setDaftar(data ?? [])
    setLoading(false)
  }, [contentId])

  useEffect(() => { muat() }, [muat])

  async function kirim(e) {
    e.preventDefault()
    if (!teks.trim()) return

    setSibuk(true)
    setGalat(null)

    const { data, error } = await supabase
      .from('comments')
      .insert({
        tenant_id: tenantId,
        content_item_id: contentId,
        user_id: user?.id ?? null,
        body: teks.trim(),
      })
      .select('id,body,user_id,created_at')
      .single()

    setSibuk(false)

    if (error) { setGalat(error.message); return }

    setDaftar((d) => [...d, data])
    setTeks('')
  }

  async function hapus(id) {
    // Hanya komentar sendiri. Ini juga bukan pengamanan sungguhan — RLS
    // tabel comments memberi akses ke seluruh anggota workspace, jadi
    // tombol ini kemudahan, bukan penjaga. Diskusi tim memang terbuka
    // untuk tim.
    const yakin = await tanya.ask({ title: 'Hapus komentar ini?' })
    if (!yakin) return

    const { error } = await supabase.from('comments').delete().eq('id', id).eq('tenant_id', tenantId)
    if (error) { setGalat(error.message); return }
    setDaftar((d) => d.filter((k) => k.id !== id))
  }

  const anggotaById = Object.fromEntries(members.map((m) => [m.user_id, m]))

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
        <Icon name="chatbubbles-outline" size={16} color="var(--text-secondary)" />
        <p style={{ fontSize: 14, fontWeight: 600 }}>Diskusi</p>
        {daftar.length > 0 && (
          <span className="chip" style={{ marginLeft: 'auto' }}>{daftar.length}</span>
        )}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.55 }}>
        Pembahasan soal konten ini menempel di sini, bukan tercecer di chat.
      </p>

      {galat && <p className="alert alert-error" style={{ marginBottom: 12 }}>{galat}</p>}

      {loading && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Memuat...</p>}

      {!loading && daftar.length === 0 && (
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 14 }}>
          Belum ada yang berkomentar.
        </p>
      )}

      {daftar.map((k) => {
        const anggota = anggotaById[k.user_id]
        const milikSaya = k.user_id === user?.id
        return (
          <div key={k.id} style={{ display: 'flex', gap: 9, padding: '10px 0', borderTop: '0.5px solid var(--border)' }}>
            <Avatar anggota={anggota ?? null} size={26} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                  {anggota ? namaAnggota(anggota) : 'Anggota yang sudah keluar'}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{waktuRelatif(k.created_at)}</span>
                {milikSaya && (
                  <button
                    type="button"
                    onClick={() => hapus(k.id)}
                    aria-label="Hapus komentar"
                    style={{
                      marginLeft: 'auto', border: 'none', background: 'transparent',
                      cursor: 'pointer', color: 'var(--text-muted)', padding: 2, lineHeight: 1,
                    }}
                  >
                    <Icon name="trash-outline" size={13} />
                  </button>
                )}
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, marginTop: 2, whiteSpace: 'pre-wrap' }}>{k.body}</p>
            </div>
          </div>
        )
      })}

      <form onSubmit={kirim} style={{ marginTop: 14, paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
        <textarea
          className="textarea"
          rows={2}
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          placeholder="Tulis komentar..."
          style={{ minHeight: 56, marginBottom: 9 }}
        />
        <button type="submit" className="btn btn-sm btn-primary" disabled={sibuk || !teks.trim()}>
          <Icon name="send-outline" size={14} /> {sibuk ? 'Mengirim...' : 'Kirim'}
        </button>
      </form>

      {tanya.dialog}
    </div>
  )
}
