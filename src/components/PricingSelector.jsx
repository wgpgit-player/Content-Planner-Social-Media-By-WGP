import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { priceLabel } from '../lib/adminCatalog'
import { PREVIEW_PLANS, PREVIEW_ADDONS, calculateQuote } from '../lib/pricing'
import { checkoutUrl } from '../lib/checkout'
import Icon from './Icon'
import '../pricing.css'

export default function PricingSelector({compact=false}){
 const [plans,setPlans]=useState(supabase?[]:PREVIEW_PLANS)
 const [addons,setAddons]=useState(supabase?[]:PREVIEW_ADDONS)
 const [selected,setSelected]=useState('dasar')
 const [period,setPeriod]=useState('monthly')
 const [quantities,setQuantities]=useState({})
 const [status,setStatus]=useState(supabase?'loading':'ready')
 const [retry,setRetry]=useState(0)
 useEffect(()=>{
  if(!supabase)return
  let cancelled=false;setStatus('loading')
  Promise.all([supabase.from('paket_langganan').select('*').eq('tampil',true).order('urutan'),supabase.from('addon_langganan').select('*').eq('tampil',true).order('urutan')]).then(([p,a])=>{
   if(cancelled)return
   if(p.error||a.error){setStatus('error');return}
   setPlans(p.data||[]);setAddons(a.data||[]);setStatus('ready')
   setSelected(old=>(p.data||[]).some(x=>x.key===old)?old:(p.data||[])[0]?.key||'')
   setQuantities({})
  }).catch(()=>{if(!cancelled)setStatus('error')})
  return ()=>{cancelled=true}
 },[retry])
 const plan=plans.find(p=>p.key===selected)
 const free=plan && Number(plan.harga_bulanan)===0 && plan.harga_bulanan!=null
 const activeAddons=free?[]:addons
 const quote=calculateQuote(plan,period,activeAddons,quantities)
 if(status==='loading')return <p className="pricing-status" role="status">Memuat pilihan paket…</p>
 if(status==='error')return <div className="pricing-status" role="alert">Harga belum dapat dimuat. <button type="button" onClick={()=>setRetry(x=>x+1)}>Coba lagi</button></div>
 if(!plans.length)return <p className="pricing-status">Paket sedang diperbarui. Silakan hubungi admin untuk informasi ketersediaan.</p>
 return <div className={'pricing-selector'+(compact?' pricing-compact':'')}>
  <div className="pricing-period" role="group" aria-label="Periode langganan"><button type="button" aria-pressed={period==='monthly'} onClick={()=>setPeriod('monthly')}>Bulanan</button><button type="button" aria-pressed={period==='yearly'} onClick={()=>setPeriod('yearly')}>Tahunan</button></div>
  <div className="pricing-grid">{plans.map(p=>{
   const amount=p[period==='yearly'?'harga_tahunan':'harga_bulanan']
   const saving=Number(p.harga_bulanan)*12-Number(p.harga_tahunan)
   return <article key={p.key} className={'pricing-card'+(p.key===selected?' chosen':'')}>
    <div className="pricing-card-head"><h3>{p.nama}</h3>{p.key==='dasar' && <span>Untuk tim kecil</span>}</div>
    <p className="pricing-description">{p.deskripsi}</p>
    <p className="pricing-amount">{priceLabel(amount)}<small> / {period==='yearly'?'tahun':'bulan'}</small></p>
    <p className="pricing-scope">Per workspace{period==='yearly' && amount!=null && saving>0?' · Hemat '+priceLabel(saving)+'/tahun':''}</p>
    <button type="button" className="pricing-select" aria-pressed={p.key===selected} onClick={()=>{setSelected(p.key);setQuantities({})}}>{p.key===selected?<><Icon name="checkmark-circle" size={18}/>Paket dipilih</>:'Pilih '+p.nama}</button>
    <ul>{(p.fitur||[]).map((f,i)=><li key={i}><Icon name="checkmark-outline" size={17}/>{f}</li>)}</ul>
   </article>
  })}</div>
  {!free && addons.length>0 && <div className="pricing-addons"><div className="pricing-addon-title"><h3>Tambah kapasitas sesuai kebutuhan.</h3><p>Add-on opsional untuk satu workspace. Bisa dipilih lebih dari satu.</p></div><div className="pricing-addon-grid">{addons.map(a=><label className={'pricing-addon'+(quantities[a.key]?' chosen':'')} key={a.key}><span className="pricing-addon-icon"><Icon name="folder-open-outline" size={25}/></span><span className="pricing-addon-copy"><strong>{a.nama}</strong><span>{a.deskripsi}</span><b>{priceLabel(a.harga_bulanan)} / bulan</b></span><select aria-label={'Jumlah '+a.nama} value={quantities[a.key]||0} onChange={e=>setQuantities({...quantities,[a.key]:Number(e.target.value)})}>{Array.from({length:11},(_,i)=><option value={i} key={i}>{i===0?'Tidak perlu':i+' unit'}</option>)}</select></label>)}</div>{period==='yearly' && <p className="pricing-note">Add-on tahunan dihitung 12 × harga bulanan, tanpa diskon paket.</p>}</div>}
  <div className="pricing-summary" aria-live="polite"><div><span>{plan?.nama} · 1 workspace · {period==='yearly'?'12 bulan':'1 bulan'}</span><strong>{quote?priceLabel(quote.total):'Harga belum tersedia'}</strong>{quote?.extra>0 && <small>Paket {priceLabel(quote.base)} + add-on {priceLabel(quote.extra)}</small>}</div>
   {free?<Link to="/signup" className="pricing-order">Mulai gratis</Link>
    :!quote?<span>Harga sedang diperbarui.</span>
    :<Link className="pricing-order" to={checkoutUrl(plan.key,period,quantities)}>Bayar dengan QRIS <Icon name="qr-code-outline" size={17}/></Link>}
  </div><p className="pricing-note">Bayar QRIS, lalu unggah bukti. Paket aktif setelah admin menyetujui pembayaran. Tidak ada pendebitan otomatis.</p>
 </div>
}

