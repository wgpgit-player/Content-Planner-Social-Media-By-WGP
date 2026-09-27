import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
const answers={start:{label:'Mulai dari mana?',text:'Punya ide? Buka Susun konten. Kalau masih mencari arah, mulai dari Bank ide atau coba Meja ide di halaman ini.',link:'/signup',action:'Buat workspace'},plans:{label:'Pilih paket',text:'Paket dibedakan berdasarkan kapasitas penyimpanan. Lihat harga terbaru dan pilih tambahan kapasitas di bagian paket.',link:'/tentang#paket',action:'Lihat paket'},review:{label:'Review klien',text:'Bagikan tautan review agar klien bisa memberi catatan dan persetujuan tanpa membuat akun.',link:'/tentang#fitur',action:'Kenali fitur'},posting:{label:'Bisa auto-post?',text:'Saat ini plannersm membantu perencanaan, produksi, dan review. Publikasi tetap dilakukan lewat media sosial masing-masing.',link:'/tentang#pertanyaan',action:'Baca pertanyaan lain'}}
export default function StudioInteractions({inApp=false}){
 const [open,setOpen]=useState(false),[topic,setTopic]=useState('start'),[cursor,setCursor]=useState(false)
 const dialog=useRef(null),ring=useRef(null),trigger=useRef(null)
 useEffect(()=>{if(open&&!dialog.current.open)dialog.current.showModal();else if(!open&&dialog.current.open)dialog.current.close()},[open])
 useEffect(()=>{
  if(!cursor)return
  const media=matchMedia('(pointer:fine) and (prefers-reduced-motion:no-preference)');let frame=0
  const move=e=>{if(!media.matches)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(ring.current){ring.current.style.transform=`translate3d(${e.clientX-16}px,${e.clientY-16}px,0)`;ring.current.style.opacity='1'}})}
  const hide=()=>{if(ring.current)ring.current.style.opacity='0'}
  window.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerleave',hide);window.addEventListener('blur',hide)
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',hide);window.removeEventListener('blur',hide)}
 },[cursor])
 function close(){setOpen(false);trigger.current?.focus()}
 useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous}},[open])
 const answer=answers[topic]
 return <><div className="studio-tools">{!inApp&&<button className="cursor-toggle" aria-pressed={cursor} onClick={()=>setCursor(!cursor)}>{cursor?'Efek kursor aktif':'Coba efek kursor'}<span aria-hidden="true">✧</span></button>}<button ref={trigger} className="guide-trigger" onClick={()=>setOpen(true)} aria-haspopup="dialog"><img src="/brand/plannersm-icon.svg" alt=""/>Butuh arah?</button></div>{cursor&&<div ref={ring} className="creative-cursor" aria-hidden="true"/>}
 <dialog ref={dialog} className="studio-guide" aria-labelledby="guide-title" onCancel={close} onClose={()=>{setOpen(false)}} onClick={e=>{if(e.target===dialog.current)close()}}><div className="guide-heading"><div><span>Panduan plannersm</span><h2 id="guide-title">Lagi cari apa?</h2></div><button autoFocus onClick={close} aria-label="Tutup panduan">×</button></div><div className="guide-welcome"><img src="/images/creative-guide.png" alt=""/><p>Pilih topik di bawah.<br/>Kita mulai dari yang kamu butuhkan.</p></div><div className="guide-topics">{Object.entries(answers).map(([key,a])=><button key={key} aria-pressed={topic===key} onClick={()=>setTopic(key)}>{a.label}</button>)}</div><div className="guide-answer" aria-live="polite"><p>{answer.text}</p><Link onClick={close} to={inApp&&topic==='start'?'/compose':answer.link}>{inApp&&topic==='start'?'Susun konten':answer.action}</Link></div><p className="guide-disclosure">Panduan otomatis berbasis topik, bukan chat AI atau admin online.</p><a className="guide-contact" href="https://wa.me/6285111037992" target="_blank" rel="noopener noreferrer">Lanjut ngobrol dengan admin</a></dialog></>
}
