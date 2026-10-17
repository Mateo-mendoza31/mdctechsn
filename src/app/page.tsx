'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Producto = { id: number; nombre: string; precio: number; imagen: string; categoria: string }
type CartItem = Producto & { cantidad: number }
const MI_ALIAS = "mdc.tech.mp"

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [paso, setPaso] = useState(1)
  const [filtro, setFiltro] = useState('Todos')
  const [form, setForm] = useState({ nombre: '', direccion: '', barrio: '', altura: '', telefono: '', pago: 'Transferencia' })
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)

  useEffect(() => {
    supabase.from('productos').select('*').order('id').then(({data})=>{
      if(data) setProductos(data.map((p:any)=>({...p, imagen: encodeURI(p.imagen)})))
    })
  }, [])

  const addToCart = (p: Producto) => {
    setCart(prev => {
      const ex = prev.find(i=>i.id===p.id)
      if(ex) return prev.map(i=>i.id===p.id?{...i,cantidad:i.cantidad+1}:i)
      return [...prev,{...p,cantidad:1}]
    })
    setShowCart(true)
  }

  const total = cart.reduce((s,i)=>s+i.precio*i.cantidad,0)
  const categorias = ['Todos', ...Array.from(new Set(productos.map(p=>p.categoria)))]
  const filtrados = filtro==='Todos'?productos:productos.filter(p=>p.categoria.toLowerCase().trim()===filtro.toLowerCase().trim())

  const finalizar = async () => {
    if(!form.nombre || !form.direccion) { alert('Falta nombre o dirección'); return }
    if(form.pago==='Transferencia' && !comprobante) { alert('Subí el comprobante'); return }
    setSubiendo(true)
    let comprobanteUrl = null
    if(comprobante){
      const name = `${Date.now()}-${comprobante.name}`
      await supabase.storage.from('comprobantes').upload(name, comprobante)
      const {data} = supabase.storage.from('comprobantes').getPublicUrl(name)
      comprobanteUrl = data.publicUrl
    }
    const {error} = await supabase.from('pedidos').insert([{
      cliente_nombre: form.nombre,
      direccion: `${form.direccion} ${form.altura} - ${form.barrio}`,
      barrio: form.barrio, altura: form.altura,
      telefono: form.telefono, metodo_pago: form.pago,
      productos: cart, total, comprobante_url: comprobanteUrl, alias_pagado: MI_ALIAS
    }])
    setSubiendo(false)
    if(error){ alert(error.message); return }
    alert('Pedido guardado!')
    setCart([]); setShowCart(false); setPaso(1)
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-between items-center max-w-7xl mx-auto"><h1 className="text-4xl font-black">MDC TECH</h1><button onClick={()=>setShowCart(true)} className="bg-white text-black px-6 py-3 rounded-full font-bold">Carrito ({cart.reduce((a,b)=>a+b.cantidad,0)})</button></div>
      <div className="flex gap-3 mt-8 max-w-7xl mx-auto flex-wrap">{categorias.map(cat=><button key={cat} onClick={()=>setFiltro(cat)} className={`px-6 py-2.5 rounded-full font-bold border ${filtro===cat?'bg-white text-black':'text-zinc-400 border-zinc-800'}`}>{cat}</button>)}</div>
      <div className="max-w-7xl mx-auto mt-10 grid gap-6" style={{gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))'}}>{filtrados.map(p=><div key={p.id} className="bg-[#1a1a1a] rounded-[24px] p-3 border border-zinc-800"><div className="bg-white rounded-[18px] aspect-square p-2"><img src={p.imagen} className="w-full h-full object-contain"/></div><div className="p-2 pt-3"><h3 className="font-bold text-sm min-h-[40px]">{p.nombre}</h3><p className="text-xl font-black mt-2">${p.precio.toLocaleString()}</p><button onClick={()=>addToCart(p)} className="w-full bg-white text-black py-3 rounded-full font-bold mt-3">Agregar +</button></div></div>)}</div>
      {showCart && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-end"><div className="bg-zinc-900 w-[400px] p-6 h-full overflow-y-auto">
          <div className="flex justify-between"><h2 className="font-bold">Paso {paso}/3</h2><button onClick={()=>setShowCart(false)} className="w-8 h-8 bg-zinc-800 rounded-full">X</button></div>
          {paso===1 && <><div className="mt-6 space-y-2">{cart.map(i=><div key={i.id} className="flex justify-between items-center bg-black p-3 rounded-xl text-sm"><span>{i.nombre} x{i.cantidad}</span><button onClick={()=>setCart(c=>c.filter(x=>x.id!==i.id))} className="bg-red-500/20 text-red-400 w-7 h-7 rounded-full">x</button></div>)}</div><button onClick={()=>setCart([])} className="text-xs text-red-400 mt-3 underline">Eliminar pedido / Vaciar carrito</button><p className="text-2xl font-black mt-6">Total ${total.toLocaleString()}</p><button onClick={()=>setPaso(2)} className="w-full bg-white text-black py-4 rounded-full mt-6 font-black">Siguiente</button></>}
          {paso===2 && <><input placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} className="w-full bg-black border border-zinc-700 p-4 rounded-2xl mt-6"/><input placeholder="Calle" value={form.direccion} onChange={e=>setForm({...form,direccion:e.target.value})} className="w-full bg-black border border-zinc-700 p-4 rounded-2xl mt-3"/><div className="flex gap-3"><input placeholder="Altura" value={form.altura} onChange={e=>setForm({...form,altura:e.target.value})} className="w-1/2 bg-black border border-zinc-700 p-4 rounded-2xl mt-3"/><input placeholder="Barrio" value={form.barrio} onChange={e=>setForm({...form,barrio:e.target.value})} className="w-1/2 bg-black border border-zinc-700 p-4 rounded-2xl mt-3"/></div><input placeholder="WhatsApp" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} className="w-full bg-black border border-zinc-700 p-4 rounded-2xl mt-3"/><div className="flex gap-3 mt-6"><button onClick={()=>setPaso(1)} className="w-1/2 bg-zinc-800 py-4 rounded-full">← Volver</button><button onClick={()=>setPaso(3)} className="w-1/2 bg-white text-black py-4 rounded-full font-black">Ir a Pago</button></div></>}
          {paso===3 && <><select value={form.pago} onChange={e=>setForm({...form,pago:e.target.value})} className="w-full bg-black border border-zinc-700 p-4 rounded-2xl mt-6"><option>Transferencia</option><option>Efectivo</option></select>{form.pago==='Transferencia' && <div className="bg-black border border-green-500/30 p-4 rounded-2xl mt-4"><p className="text-sm">Alias:</p><p className="text-xl font-black text-green-400">{MI_ALIAS}</p><input type="file" accept="image/*" onChange={e=>setComprobante(e.target.files?.[0]||null)} className="w-full mt-3 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-white file:text-black file:font-bold"/></div>}<div className="flex gap-3 mt-6"><button onClick={()=>setPaso(2)} className="w-1/2 bg-zinc-800 py-4 rounded-full">← Volver</button><button onClick={finalizar} disabled={subiendo} className="w-1/2 bg-green-400 text-black py-4 rounded-full font-black">{subiendo?'Subiendo...':'Confirmar'}</button></div></>}
        </div></div>
      )}
    </main>
  )
}