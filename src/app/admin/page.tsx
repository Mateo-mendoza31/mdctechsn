'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Admin() {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [productos, setProductos] = useState<any[]>([])

  const cargar = async () => {
    const { data: pedidosData } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false })
    const { data: prodData } = await supabase.from('productos').select('*').order('id')
    if (pedidosData) setPedidos(pedidosData)
    if (prodData) setProductos(prodData)
  }

  useEffect(() => { cargar() }, [])

  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', id)
    cargar()
  }

  const eliminarPedido = async (id: number) => {
    if(!confirm('¿Borrar pedido?')) return
    await supabase.from('pedidos').delete().eq('id', id)
    cargar()
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-black">PANEL MDC TECH</h1>
      <p className="text-zinc-400">Total pedidos: {pedidos.length} | Productos: {productos.length}</p>

      <h2 className="text-2xl font-bold mt-10 mb-4">Pedidos - {pedidos.length}</h2>
      <div className="space-y-4">
        {pedidos.length===0 && <p className="text-zinc-500">Todavía no hay pedidos. Hacé una compra de prueba.</p>}
        {pedidos.map(p => (
          <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex gap-5">
            <div className="flex-1">
              <p className="font-black">#{p.id} - {p.cliente_nombre} - ${p.total?.toLocaleString()}</p>
              <p className="text-sm text-zinc-400 mt-1">{p.direccion} | {p.telefono} | Pago: {p.metodo_pago}</p>
              <p className="text-xs text-zinc-500 mt-2">Productos: {JSON.stringify(p.productos?.map((x:any)=>`${x.nombre} x${x.cantidad}`))}</p>
              <p className="text-xs mt-2">Estado: <b className={p.estado==='pendiente'?'text-yellow-400':'text-green-400'}>{p.estado}</b> | Alias usado: {p.alias_pagado}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={()=>cambiarEstado(p.id, 'pagado')} className="bg-green-500 text-black px-3 py-1 rounded-full text-xs font-bold">Marcar Pagado</button>
                <button onClick={()=>cambiarEstado(p.id, 'enviado')} className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold">Marcar Enviado</button>
                <button onClick={()=>eliminarPedido(p.id)} className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs">Eliminar</button>
              </div>
            </div>
            {p.comprobante_url && (
              <a href={p.comprobante_url} target="_blank" className="w-24 h-24 bg-white rounded-xl overflow-hidden block">
                <img src={p.comprobante_url} className="w-full h-full object-cover"/>
              </a>
            )}
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold mt-12 mb-4">Productos en Supabase</h2>
      <div className="grid gap-2" style={{gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))'}}>
        {productos.map(pr=>(
          <div key={pr.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
            <img src={pr.imagen} className="w-full h-24 object-contain bg-white rounded-lg"/>
            <p className="font-bold text-sm mt-2">{pr.nombre}</p>
            <p className="text-xs text-zinc-400">{pr.categoria} - ${pr.precio}</p>
          </div>
        ))}
      </div>
    </main>
  )
}