import { useCallback, useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'

// Pengganti window.confirm() berbasis Promise, supaya kode pemanggilnya
// tetap sesederhana `if (!(await tanya.ask({...}))) return`, tapi kotaknya
// sendiri ikut gaya visual aplikasi (lihat ConfirmDialog.jsx) alih-alih
// kotak bawaan browser yang tidak konsisten antar sistem operasi.
//
// Satu hook ini dipakai satu kali per halaman/komponen yang butuh
// konfirmasi — render {tanya.dialog} sekali di JSX-nya, lalu panggil
// tanya.ask({...}) dari fungsi mana pun di komponen yang sama.
export function useConfirm() {
  const [state, setState] = useState(null)
  const [busy, setBusy] = useState(false)
  const resolver = useRef(null)

  const ask = useCallback((opts) => {
    setState(opts)
    setBusy(false)
    return new Promise((resolve) => { resolver.current = resolve })
  }, [])

  function selesai(hasil) {
    setState(null)
    setBusy(false)
    resolver.current?.(hasil)
    resolver.current = null
  }

  const dialog = state ? (
    <ConfirmDialog
      open
      busy={busy}
      title={state.title}
      description={state.description}
      labelConfirm={state.labelConfirm}
      labelCancel={state.labelCancel}
      danger={state.danger}
      onConfirm={() => {
        // Kalau pemanggilnya butuh waktu (mis. menunggu request Supabase)
        // sebelum kotak ini menutup sendiri, tandai busy dulu — tapi kotak
        // ini sendiri tidak tahu kapan itu selesai, jadi ia tetap langsung
        // meng-resolve promise-nya; pemanggil yang mengatur kapan menutup
        // lewat urutan kode biasa (ask() lalu await proses lalu lanjut).
        selesai(true)
      }}
      onCancel={() => selesai(false)}
    />
  ) : null

  return { ask, dialog, setBusy }
}
