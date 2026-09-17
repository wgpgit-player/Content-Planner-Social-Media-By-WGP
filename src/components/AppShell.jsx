import Sidebar from './Sidebar'

// Kerangka halaman untuk layar yang sudah login: sidebar di kiri, konten di
// kanan, dengan lebar maksimum supaya teks tidak melebar berlebihan di monitor
// lebar (salah satu hal yang paling merusak keterbacaan).
export default function AppShell({ title, description, actions, children, maxWidth = 860 }) {
  return (
    <div
      style={{
        background: 'var(--bg-page)', minHeight: '100vh', padding: 16,
        display: 'grid', gridTemplateColumns: '190px 1fr', gap: 16, alignItems: 'start',
      }}
    >
      <Sidebar />

      <div style={{ maxWidth, width: '100%' }}>
        {(title || actions) && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18, padding: '4px 2px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {title && <h1 className="page-title">{title}</h1>}
              {description && <p className="page-subtitle" style={{ marginTop: 3 }}>{description}</p>}
            </div>
            {actions}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
