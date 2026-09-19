import Sheet from './Sheet'

// Kotak konfirmasi sebelum tindakan yang tidak bisa dibatalkan — dipakai
// lewat hook useConfirm() (lib/useConfirm.js), bukan dipasang langsung satu
// per satu. Menggantikan window.confirm() bawaan browser, yang bentuknya
// beda-beda di tiap sistem operasi dan tidak bisa mengikuti gaya aplikasi
// ini sama sekali.
export default function ConfirmDialog({
  open,
  title,
  description,
  labelConfirm = 'Hapus',
  labelCancel = 'Batal',
  danger = true,
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <Sheet open onClose={onCancel} lebar={380}>
      <div className="confirm-dialog">
        <p className="confirm-dialog-judul">{title}</p>
        {description && <p className="confirm-dialog-teks">{description}</p>}

        <div className="confirm-dialog-aksi">
          <button type="button" className="btn btn-ghost btn-block" onClick={onCancel} disabled={busy}>
            {labelCancel}
          </button>
          <button
            type="button"
            className={`btn btn-block ${danger ? 'btn-danger-solid' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Memproses...' : labelConfirm}
          </button>
        </div>
      </div>
    </Sheet>
  )
}
