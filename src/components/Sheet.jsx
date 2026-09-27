import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'

// Portals keep fixed dialogs independent of animated/scrolling page containers.
export default function Sheet({ open = true, onClose, title, description, children, footer, lebar = 400, labelTutup = 'Tutup' }) {
  const [present, setPresent] = useState(open)
  const panelRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const visible = open || present

  useEffect(() => {
    if (open) { setPresent(true); return }
    const timer = setTimeout(() => setPresent(false), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!visible) return
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector('button')?.focus({ preventScroll: true })
    function onKey(e) {
      const dialogs = document.querySelectorAll('.sheet-panel')
      if (dialogs[dialogs.length - 1] !== panelRef.current) return
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current?.(); return }
      if (e.key !== 'Tab') return
      const nodes = [...panelRef.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(el => el.getClientRects().length)
      if (!nodes.length) { e.preventDefault(); panelRef.current.focus(); return }
      const first=nodes[0], last=nodes[nodes.length-1]
      if (e.shiftKey && (document.activeElement === first || !panelRef.current.contains(document.activeElement))) {e.preventDefault(); last.focus()}
      else if (!e.shiftKey && (document.activeElement === last || !panelRef.current.contains(document.activeElement))) {e.preventDefault(); first.focus()}
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
      if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true})
    }
  }, [visible])

  if (!visible) return null
  return createPortal(
    <div className={`sheet-lapis${open ? '' : ' sheet-closing'}`} onClick={() => closeRef.current?.()} role="presentation">
      <div ref={panelRef} className="sheet-panel" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title || labelTutup} tabIndex={-1} style={{'--sheet-lebar':`${lebar}px`}}>
        <div className="sheet-kepala">
          <div className="sheet-judul-blok">
            {title && <h2 className="sheet-judul">{title}</h2>}
            {description && <p className="sheet-ket">{description}</p>}
          </div>
          <button type="button" className="sheet-close" onClick={() => closeRef.current?.()} aria-label={labelTutup}><Icon name="close-outline" size={21}/></button>
        </div>
        <div className="sheet-badan">{children}</div>
        {footer && <div className="sheet-kaki">{footer}</div>}
      </div>
    </div>, document.body
  )
}
