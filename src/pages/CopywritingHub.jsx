import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Icon from '../components/Icon'
import HookLibrary from './HookLibrary'
import CtaLibrary from './CtaLibrary'
import CaptionFormulaLibrary from './CaptionFormulaLibrary'
import HashtagSets from './HashtagSets'
import ContentPillar from './ContentPillar'

// Pustaka Copywriting & Aset Konten Terpadu.
//
// Menggabungkan 5 pustaka yang sebelumnya terpisah (Hook, CTA, Formula Caption,
// Set Hashtag, dan Pilar Konten) ke dalam satu halaman bertab horizontal yang rapi.
// Mengurangi kepadatan menu sidebar hingga 80% dan mempermudah kreator berpindah referensi.

const TABS = [
  { key: 'hook', label: 'Pustaka Hook', icon: 'fish-outline', deskripsi: 'Kalimat pembuka pemikat perhatian 3 detik pertama' },
  { key: 'cta', label: 'Pustaka CTA', icon: 'megaphone-outline', deskripsi: 'Ajakan bertindak siap pakai untuk konversi & interaksi' },
  { key: 'formula', label: 'Formula Caption', icon: 'chatbubble-ellipses-outline', deskripsi: 'Kerangka & struktur naskah copywriting teruji' },
  { key: 'hashtag', label: 'Set Hashtag', icon: 'pricetags-outline', deskripsi: 'Kumpulan hashtag terkelompok per pilar & tema' },
  { key: 'pilar', label: 'Pilar Konten', icon: 'layers-outline', deskripsi: 'Fondasi tema & porsi distribusi materi media sosial' },
]

export default function CopywritingHub() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabAktif = searchParams.get('tab') || 'hook'

  function pilihTab(key) {
    setSearchParams({ tab: key })
  }

  const tabInfo = TABS.find((t) => t.key === tabAktif) || TABS[0]

  return (
    <div className="copywriting-hub-container">
      {/* Tab Bar Horizontal */}
      <div
        style={{
          background: 'var(--surface-0, #fff)',
          borderBottom: '1px solid var(--border, #e5e7eb)',
          padding: '12px 20px 0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Pustaka Copywriting & Aset Konten
              </h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                {tabInfo.deskripsi}
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 0,
              scrollbarWidth: 'none',
            }}
          >
            {TABS.map((t) => {
              const aktif = t.key === tabAktif
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => pilihTab(t.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '9px 16px',
                    fontSize: 13,
                    fontWeight: aktif ? 650 : 500,
                    color: aktif ? 'var(--accent, #5935d5)' : 'var(--text-secondary)',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: aktif ? '2.5px solid var(--accent, #5935d5)' : '2.5px solid transparent',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon name={t.icon} size={15} color={aktif ? 'var(--accent, #5935d5)' : 'currentColor'} />
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Konten Tab Terpilih */}
      <div className="copywriting-tab-content">
        {tabAktif === 'hook' && <HookLibrary />}
        {tabAktif === 'cta' && <CtaLibrary />}
        {tabAktif === 'formula' && <CaptionFormulaLibrary />}
        {tabAktif === 'hashtag' && <HashtagSets />}
        {tabAktif === 'pilar' && <ContentPillar />}
      </div>
    </div>
  )
}
