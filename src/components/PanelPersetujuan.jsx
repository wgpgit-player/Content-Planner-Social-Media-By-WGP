import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useTenantContext } from '../context/TenantContext'
import { useTenantMembers, namaAnggota } from '../lib/useTenantMembers'
import { getApproval, KEPUTUSAN_LABEL } from '../config/approval'
import { urlMateri } from '../lib/materi'
import Icon from './Icon'

// Panel persetujuan di halaman brief.
//
// Aturannya ada di database, bukan di sini: trigger jaga_aturan_persetujuan()
// menolak staff yang mencoba menyetujui, dan mengisi sendiri kolom siapa dan
// kapan. Tombol yang disembunyikan di panel ini hanya kemudahan supaya orang
// tidak menekan sesuatu yang pasti ditolak — bukan pengamanannya.
//
// Karena itu pesan galat dari server ditampilkan apa adanya di layar. Kalau
// ada yang menembus lewat jalur lain, penolakannya harus terlihat.

function Baris({ review, members }) {
  // Anggota bisa sudah keluar dari workspace sementara jejak keputusannya
  // tetap ada. Kalau begitu, namanya tidak bisa dicari lagi — dan "Tanpa
  // nama" akan terlihat seperti kesalahan, jadi disebut apa adanya.
  const anggota = review.reviewer_user_id
    ? members.find((m) => m.user_id === review.reviewer_user_id)
    : null
  const nama = review.reviewer_user_id
    ? (anggota ? namaAnggota(anggota) : 'Anggota yang sudah keluar')
    : review.reviewer_label

  const a = getApproval(
    review.decision === 'submitted' ? 'pending' : review.decision
  )

  const waktu = new Date(review.created_at)
  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

  return (
    <div style={{ display: 'flex', gap: 9, padding: '9px 0', borderTop: '0.5px solid var(--border)' }}>
      <span style={{ display: 'flex', flexShrink: 0, marginTop: 1 }}>
        <Icon name={a.icon} size={15} color={a.color} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 12.5 }}>
          <span style={{ fontWeight: 600 }}>{nama}</span>
          {' — '}
          <span style={{ color: a.color }}>{KEPUTUSAN_LABEL[review.decision] ?? review.decision}</span>
        </p>
        {review.note && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.55 }}>
            “{review.note}”
          </p>
        )}
        <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>
          {waktu.getDate()} {BULAN[waktu.getMonth()]} {waktu.getFullYear()}
          {' · '}
          {String(waktu.getHours()).padStart(2, '0')}.{String(waktu.getMinutes()).padStart(2, '0')}
        </p>
      </div>
    </div>
  )
}

export default function PanelPersetujuan({ contentId, nilai, lampiran, onBerubah }) {
  const { tenantId, isAdmin } = useTenantContext()
  const { members } = useTenantMembers()

  const [riwayat, setRiwayat] = useState([])
  const [catatan, setCatatan] = useState('')
  const [isiCatatan, setIsiCatatan] = useState(false)
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState(null)
  const [gambar, setGambar] = useState(null)

  const muatRiwayat = useCallback(async () => {
    if (!supabase || !contentId) return
    const { data } = await supabase
      .from('content_reviews')
      .select('id,decision,note,reviewer_user_id,reviewer_label,created_at')
      .eq('content_item_id', contentId)
      .order('created_at', { ascending: false })
    setRiwayat(data ?? [])
  }, [contentId])

  useEffect(() => { muatRiwayat() }, [muatRiwayat])

  // Materi ditampilkan DI DALAM panel ini, bukan sekadar ditautkan.
  // Menyetujui sesuatu yang harus dibuka di tab lain berarti sebagian orang
  // tidak akan membukanya, lalu menyetujui tanpa melihat.
  useEffect(() => {
    let batal = false
    if (!lampiran?.asset_path) { setGambar(null); return }
    urlMateri(lampiran.asset_path).then((u) => { if (!batal) setGambar(u) })
    return () => { batal = true }
  }, [lampiran?.asset_path])

  const a = getApproval(nilai?.approval_state)

  async function putuskan(keputusan, catatanIni) {
    if (!supabase) return
    setSibuk(true)
    setGalat(null)

    const { error } = await supabase
      .from('content_items')
      .update({ approval_state: keputusan })
      .eq('id', contentId)
      .eq('tenant_id', tenantId)

    if (error) {
      setSibuk(false)
      setGalat(error.message)
      return
    }

    // Jejak keputusan ditulis terpisah. Kalau baris ini gagal, perubahan
    // statusnya sudah terjadi — jadi kegagalannya ditampilkan, tidak
    // ditelan, supaya tidak ada keputusan tanpa catatan yang diam-diam.
    const { error: errJejak } = await supabase.from('content_reviews').insert({
      tenant_id: tenantId,
      content_item_id: contentId,
      decision: keputusan === 'pending' ? 'submitted' : keputusan,
      note: catatanIni?.trim() ? catatanIni.trim() : null,
      reviewer_user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
    })

    setSibuk(false)
    setCatatan('')
    setIsiCatatan(false)

    if (errJejak) {
      setGalat(`Status berubah, tapi catatan riwayatnya gagal disimpan: ${errJejak.message}`)
    }

    await muatRiwayat()
    onBerubah?.()
  }

  const anggotaPenyetuju = nilai?.approved_by
    ? members.find((m) => m.user_id === nilai.approved_by)
    : null
  const penyetuju = anggotaPenyetuju ? namaAnggota(anggotaPenyetuju) : null

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Icon name="shield-checkmark-outline" size={16} color="var(--text-secondary)" />
        <p style={{ fontSize: 14, fontWeight: 600 }}>Persetujuan</p>
        <span
          className="chip"
          style={{ background: a.bg, color: a.color, borderColor: 'transparent', marginLeft: 'auto' }}
        >
          <Icon name={a.icon} size={12} /> {a.label}
        </span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.55 }}>
        {nilai?.approval_state === 'approved' && penyetuju
          ? `Disetujui oleh ${penyetuju}. Konten ini sudah boleh tayang.`
          : nilai?.approval_state === 'approved'
            ? 'Sudah disetujui. Konten ini boleh tayang.'
            : nilai?.approval_state === 'pending'
              ? 'Sudah diajukan. Menunggu keputusan admin atau klien.'
              : nilai?.approval_state === 'changes_requested'
                ? 'Ada yang perlu diperbaiki. Lihat catatannya di bawah, lalu ajukan lagi.'
                : 'Belum diajukan. Ajukan kalau isinya sudah siap ditinjau.'}
      </p>

      {galat && <p className="alert alert-error" style={{ marginBottom: 12 }}>{galat}</p>}

      {gambar ? (
        <img
          src={gambar}
          alt="Materi yang ditinjau"
          style={{
            width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 12,
            background: 'var(--surface-1)', border: '0.5px solid var(--border)',
            marginBottom: 12,
          }}
        />
      ) : lampiran?.asset_url ? (
        <a
          href={lampiran.asset_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm"
          style={{ textDecoration: 'none', marginBottom: 12 }}
        >
          <Icon name="open-outline" size={14} /> Buka materi di tab lain
        </a>
      ) : (
        // Peringatan, bukan larangan. Sebagian konten memang hanya caption
        // atau teks. Tapi yang menyetujui harus sadar ia sedang memutuskan
        // tanpa melihat apa pun.
        <p className="alert alert-info" style={{ marginBottom: 12 }}>
          Belum ada materi yang dilampirkan. Kalau kamu menyetujui sekarang,
          yang disetujui hanya judul dan briefnya.
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {nilai?.approval_state !== 'pending' && nilai?.approval_state !== 'approved' && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={sibuk}
            onClick={() => {
              const kosong = !lampiran?.asset_path && !lampiran?.asset_url
              if (kosong && !window.confirm(
                'Belum ada materi yang dilampirkan. Yang meninjau hanya akan melihat judul dan brief. Tetap ajukan?'
              )) return
              putuskan('pending')
            }}
          >
            <Icon name="paper-plane-outline" size={14} /> Ajukan untuk ditinjau
          </button>
        )}

        {/* Hanya admin. Trigger di database menolak yang lain, jadi tombol ini
            disembunyikan supaya staff tidak menekan sesuatu yang pasti gagal. */}
        {isAdmin && nilai?.approval_state === 'pending' && (
          <>
            <button type="button" className="btn btn-sm" disabled={sibuk} onClick={() => putuskan('approved')}
              style={{ color: 'var(--success)', borderColor: 'var(--border-strong)' }}>
              <Icon name="checkmark-circle-outline" size={14} /> Setujui
            </button>
            <button type="button" className="btn btn-sm" disabled={sibuk} onClick={() => setIsiCatatan(true)}
              style={{ color: 'var(--danger)', borderColor: 'var(--border-strong)' }}>
              <Icon name="arrow-undo-outline" size={14} /> Minta revisi
            </button>
          </>
        )}

        {isAdmin && nilai?.approval_state === 'approved' && (
          <button type="button" className="btn btn-sm btn-ghost" disabled={sibuk} onClick={() => putuskan('none')}>
            Tarik persetujuan
          </button>
        )}
      </div>

      {isiCatatan && (
        <div style={{ marginTop: 12 }}>
          <label className="field-label" htmlFor="catatan-revisi">Apa yang perlu diperbaiki?</label>
          <textarea
            id="catatan-revisi"
            className="textarea"
            rows={3}
            autoFocus
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Sebutkan yang konkret. Catatan ini yang dibaca orang yang mengerjakannya."
            style={{ minHeight: 70 }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setIsiCatatan(false); setCatatan('') }}>
              Batal
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              disabled={sibuk || catatan.trim() === ''}
              onClick={() => putuskan('changes_requested', catatan)}
            >
              Kirim permintaan revisi
            </button>
          </div>
        </div>
      )}

      {riwayat.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 2 }}>
            RIWAYAT KEPUTUSAN
          </p>
          {riwayat.map((r) => <Baris key={r.id} review={r} members={members} />)}
        </div>
      )}
    </div>
  )
}
