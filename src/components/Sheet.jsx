import { useEffect, useRef, useState } from 'react'

// Panel yang naik dari bawah layar, seperti sheet di aplikasi iOS.
//
// KENAPA SATU KOMPONEN UNTUK DUA BENTUK
//
// Di ponsel, kotak yang muncul di tengah layar itu janggal: jempol ada di
// bawah, sedangkan tombolnya di tengah, dan papan ketik yang muncul sering
// menutupi separuh kotaknya. Sheet yang naik dari bawah menyelesaikan
// keduanya sekaligus.
//
// Tapi di layar lebar, panel selebar layar yang menempel di bawah justru
// terlihat salah. Jadi komponen ini merender satu struktur yang sama, dan
// index.css yang memutuskan bentuknya: kotak di tengah pada layar lebar,
// sheet yang menempel di bawah pada layar sempit. Tidak ada percabangan di
// JavaScript, jadi tidak ada kemungkinan dua bentuk itu berbeda perilaku.
//
// Geser untuk menutup sengaja hanya aktif di area pegangan dan kepala sheet,
// bukan di seluruh badannya. Kalau seluruh badan bisa digeser, orang yang
// sedang menggulir daftar panjang di dalam sheet akan menutupnya tanpa
// sengaja.

const AMBANG_TUTUP = 90 // piksel; sejauh ini digeser ke bawah, sheet ditutup.

export default function Sheet({
  open = true,
  onClose,
  title,
  description,
  children,
  footer,
  lebar = 400,
  labelTutup = 'Tutup',
}) {
  const [geser, setGeser] = useState(0)
  const [sedangGeser, setSedangGeser] = useState(false)
  const mulaiY = useRef(null)
  const panelRef = useRef(null)

  // Escape menutup sheet. Ini yang diharapkan orang yang memakai papan ketik,
  // dan tanpa itu satu-satunya jalan keluar adalah mengklik tepat di luar
  // panel.
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Halaman di belakang tidak boleh ikut tergulir. Posisi gulirannya disimpan
  // dan dipulihkan, karena mengunci dengan overflow:hidden saja membuat
  // halaman melompat ke atas begitu sheet ditutup.
  useEffect(() => {
    if (!open) return
    const sebelumnya = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = sebelumnya }
  }, [open])

  useEffect(() => { if (open) setGeser(0) }, [open])

  if (!open) return null

  function mulai(e) {
    mulaiY.current = e.touches[0].clientY
    setSedangGeser(true)
  }

  function bergerak(e) {
    if (mulaiY.current === null) return
    const delta = e.touches[0].clientY - mulaiY.current
    // Hanya ke bawah. Menarik ke atas tidak melakukan apa-apa, sama seperti
    // sheet iOS yang sudah berada di posisi tertingginya.
    setGeser(delta > 0 ? delta : 0)
  }

  function selesai() {
    mulaiY.current = null
    setSedangGeser(false)
    if (geser > AMBANG_TUTUP) onClose?.()
    else setGeser(0)
  }

  return (
    <div className="sheet-lapis" onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        className="sheet-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title || labelTutup}
        style={{
          '--sheet-lebar': `${lebar}px`,
          transform: geser ? `translateY(${geser}px)` : undefined,
          transition: sedangGeser ? 'none' : undefined,
        }}
      >
        <div
          className="sheet-kepala"
          onTouchStart={mulai}
          onTouchMove={bergerak}
          onTouchEnd={selesai}
          onTouchCancel={selesai}
        >
          <span className="sheet-pegangan" aria-hidden="true" />
          {(title || description) && (
            <div className="sheet-judul-blok">
              {title && <p className="sheet-judul">{title}</p>}
              {description && <p className="sheet-ket">{description}</p>}
            </div>
          )}
        </div>

        <div className="sheet-badan">{children}</div>

        {footer && <div className="sheet-kaki">{footer}</div>}
      </div>
    </div>
  )
}
