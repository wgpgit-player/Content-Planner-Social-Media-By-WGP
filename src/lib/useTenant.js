import { useTenantContext } from '../context/TenantContext'

// Dipertahankan sebagai pembungkus tipis supaya halaman-halaman lama yang
// sudah memakai useTenant() tidak perlu diubah satu per satu.
//
// Isinya sekarang delegasi ke TenantContext. Versi lama file ini query sendiri
// ke tenant_members lalu meng-cache hasilnya di module scope — pendekatan itu
// tidak lagi benar setelah aplikasi jadi multi-workspace, karena cache-nya
// tidak ikut berubah saat user pindah workspace lewat TenantSwitcher.
export function useTenant() {
  const { tenantId, loading, error } = useTenantContext()
  return { tenantId, loading, error }
}
