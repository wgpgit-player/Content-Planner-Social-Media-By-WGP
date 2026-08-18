import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from '../context/AuthContext'

// Hook kecil buat ambil tenant_id user yang lagi login, dipakai halaman-halaman
// yang perlu INSERT baris baru (content_items, content_pillars, dst) — RLS
// otomatis filter SELECT/UPDATE/DELETE lewat my_tenant_ids(), tapi INSERT
// tetap butuh tenant_id eksplisit di payload-nya.
//
// Cache sederhana di module-level supaya tidak query tenant_members berulang
// kali kalau dipakai di beberapa komponen sekaligus dalam satu sesi.
let cachedTenantId = null

export function useTenant() {
  const { user } = useAuth()
  const [tenantId, setTenantId] = useState(cachedTenantId)
  const [loading, setLoading] = useState(!cachedTenantId)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    if (!supabase || !user) {
      setLoading(false)
      return
    }

    if (cachedTenantId) {
      setTenantId(cachedTenantId)
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('tenant_members')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) {
          setError(err)
        } else if (data) {
          cachedTenantId = data.tenant_id
          setTenantId(data.tenant_id)
        }
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [user])

  return { tenantId, loading, error }
}
