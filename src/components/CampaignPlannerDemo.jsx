import { useState } from 'react'
import { useBahasa } from '../lib/bahasa'
import CampaignArt from './CampaignArt'

export default function CampaignPlannerDemo() {
  const { t } = useBahasa()
  const [brand, setBrand] = useState('')
  const [goal, setGoal] = useState('launch')
  const [order, setOrder] = useState([0, 1, 2])
  const [status, setStatus] = useState('')
  const days = t(['Senin', 'Rabu', 'Jumat'], ['Monday', 'Wednesday', 'Friday'])
  const posts = goal === 'launch'
    ? t([['Kenalan dulu', 'Carousel · 4:5', 'Kenalkan produk dan satu manfaat utamanya.'], ['Di balik layar', 'Reels · 9:16', 'Rekam proses dan detail yang membuat produkmu berbeda.'], ['Saatnya rilis', 'Story · 9:16', 'Bagikan penawaran dan arahkan audiens ke halaman produk.']], [['First introduction', 'Carousel · 4:5', 'Introduce the product and its main benefit.'], ['Behind the scenes', 'Reels · 9:16', 'Show the process and your distinctive details.'], ['Launch day', 'Story · 9:16', 'Share your offer and link to the product.']])
    : t([['Buka obrolan', 'Story · 9:16', 'Buat polling tentang kebiasaan audiensmu.'], ['Berbagi tips', 'Carousel · 4:5', 'Jawab pertanyaan audiens dengan tiga tips praktis.'], ['Cerita bersama', 'Reels · 9:16', 'Ceritakan pengalaman pelanggan dengan izin mereka.']], [['Start a conversation', 'Story · 9:16', 'Ask your audience about their habits with a poll.'], ['Share useful tips', 'Carousel · 4:5', 'Answer a question with three practical tips.'], ['Shared stories', 'Reels · 9:16', 'Share customer experiences with their permission.']])
  function move(index, direction) {
    setOrder(previous => {
      const next = [...previous]
      const target = index + direction
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setStatus(t('Urutan konten diperbarui.', 'Content order updated.'))
  }
  function content() {
    return [brand.trim() || t('Brand kamu', 'Your brand'), ...order.map((id, i) => `${days[i]}: ${posts[id][0]}\n${posts[id][1]}\n${posts[id][2]}`)].join('\n\n')
  }
  async function copy() {
    try { await navigator.clipboard.writeText(content()); setStatus(t('Rencana tersalin. Siap dibagikan ke tim.', 'Plan copied. Ready to share with your team.')) }
    catch { setStatus(t('Gunakan Unduh rencana untuk menyimpan hasilnya.', 'Use Download plan to save your result.')) }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([content()], { type: 'text/plain;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'rencana-konten.txt'
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setStatus(t('Rencana diunduh.', 'Plan downloaded.'))
  }
  return <section className="campaign-planner" aria-label={t('Coba rencana kampanye', 'Try a campaign plan')}>
    <div className="campaign-intro"><span className="studio-section-kicker">{t('Dari ide ke agenda', 'From idea to agenda')}</span><h2>{t(<>Satu minggu.<br/>Sudah ada arahnya.</>, <>One week.<br/>A clear direction.</>)}</h2><p>{t('Masukkan brand, pilih tujuan, lalu atur urutan kontennya. Bawa pulang rencana yang bisa langsung kamu kembangkan.', 'Add your brand, choose a goal and arrange your content. Take away a plan you can build on.')}</p><CampaignArt theme="agency" tile={4} label={t('Tim kreatif berdiskusi', 'Creative team collaborating')}/></div>
    <div className="campaign-workbench">
      <label htmlFor="demo-brand">{t('Nama brand', 'Brand name')}</label><input id="demo-brand" value={brand} maxLength={60} placeholder={t('Brand kamu', 'Your brand')} onChange={e => { setBrand(e.target.value); setStatus('') }}/>
      <div className="campaign-goals" role="group" aria-label={t('Tujuan kampanye', 'Campaign goal')}>{[['launch', t('Kenalkan produk', 'Launch a product')], ['community', t('Bangun komunitas', 'Build a community')]].map(([id, label]) => <button type="button" key={id} aria-pressed={goal === id} onClick={() => { setGoal(id); setStatus('') }}>{label}</button>)}</div>
      <div className="campaign-plan">{order.map((id, index) => <article key={id}><span className="campaign-day">{days[index]}</span><div><strong>{posts[id][0]}</strong><small>{posts[id][1]}</small><p>{posts[id][2]}</p></div><div className="campaign-reorder"><button type="button" disabled={index === 0} aria-label={t('Majukan ', 'Move earlier: ') + posts[id][0]} onClick={() => move(index, -1)}>↑</button><button type="button" disabled={index === 2} aria-label={t('Mundurkan ', 'Move later: ') + posts[id][0]} onClick={() => move(index, 1)}>↓</button></div></article>)}</div>
      <div className="campaign-actions"><button type="button" onClick={copy}>{t('Salin rencana', 'Copy plan')}</button><button type="button" onClick={download}>{t('Unduh rencana', 'Download plan')}</button><button type="button" onClick={() => { setOrder([0, 1, 2]); setBrand(''); setGoal('launch'); setStatus('') }}>{t('Ulangi', 'Reset')}</button></div>
      <p className="campaign-feedback" role="status">{status || t('Contoh rencana yang bisa kamu sesuaikan.', 'A sample plan you can make your own.')}</p>
    </div>
  </section>
}
