import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from '../context/AuthContext'

// Apakah pengguna saat ini operator platform (pemilik aplikasi)?
//
// Jawabannya datang dari database lewat is_platform_admin(), bukan dari
// sesuatu yang disimpan di peramban. Ini penting: apa pun yang disimpan di
// sisi klien bisa dipalsukan, dan menu operator yang muncul karena tebakan
// lokal akan membuat orang mengira mereka punya akses yang sebenarnya
// tidak ada — lalu setiap tombolnya gagal.
//
// Tapi ini tetap cuma kenyamanan tampilan. Penjaga yang sesungguhnya ada
// di RPC dan kebijakan RLS: memanggil daftar_klien_operator() sebagai
// bukan-operator akan ditolak database, berapa pun rapinya UI disembunyikan.
export function useOperator() {
  const { user } = useAuth()
  const [isOperator, setIsOperator] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !user) { setIsOperator(false); setLoading(false); return }

    setLoading(true)
    setIsOperator(false)
    let batal = false
    supabase.rpc('is_platform_admin').then(({ data, error }) => {
      if (batal) return
      setIsOperator(!error && data === true)
      setLoading(false)
    })
    return () => { batal = true }
  }, [user?.id])

  return { isOperator, loading }
}
