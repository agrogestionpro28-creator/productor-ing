'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/components/layout/app-shell';
import { fmtNum, fmtUSD, fmtARS, cn } from '@/lib/utils';

const TIPOS = ['agroquimico','semilla','fertilizante','otro'];
const UNIDADES = ['lt','kg','bolsas','tn','unidad'];
const VACIO = { nombre:'', tipo:'agroquimico', unidad:'lt', fecha:new Date().toISOString().slice(0,10), movimiento:'entrada', cantidad:'', precio_usd:'', precio_ars:'', proveedor:'', lote_destino:'', cultivo:'', observaciones:'' };

export function InsumosClient({ data: initial, resumen: resumenInit, userId }: any) {
  const { moneda, tipoCambio } = useApp();
  const [data, setData] = useState(initial);
  const [resumen, setResumen] = useState(resumenInit);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({...VACIO});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const fmt = (usd: number) => moneda === 'USD' ? fmtUSD(usd) : fmtARS(usd * tipoCambio);
  const resumenFiltrado = filtroTipo ? resumen.filter((r:any)=>r.tipo===filtroTipo) : resumen;

  async function guardar() {
    if (!form.nombre || !form.cantidad) { setErr('Nombre y cantidad son obligatorios'); return; }
    setSaving(true); setErr('');
    const { error } = await (createClient() as any).from('stock_insumos').insert({
      productor_id: userId, nombre: form.nombre.trim(), tipo: form.tipo,
      unidad: form.unidad, fecha: form.fecha, movimiento: form.movimiento,
      cantidad: parseFloat(form.cantidad),
      precio_usd: form.precio_usd ? parseFloat(form.precio_usd) : null,
      precio_ars: form.precio_ars ? parseFloat(form.precio_ars) : null,
      proveedor: form.proveedor || null, lote_destino: form.lote_destino || null,
      cultivo: form.cultivo || null, observaciones: form.observaciones || null,
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    const [{ data: d }, { data: r }] = await Promise.all([
      (createClient() as any).from('stock_insumos').select('*').eq('productor_id', userId).order('fecha', { ascending: false }),
      (createClient() as any).from('vw_stock_insumos').select('*').eq('productor_id', userId),
    ]);
    setData(d ?? []); setResumen(r ?? []);
    setForm({...VACIO}); setShowForm(false); setSaving(false);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <div><p className="eyebrow mb-1">Stock</p><h2 className="text-xl font-bold text-hi">Insumos</h2></div>
        <button onClick={()=>setShowForm(!showForm)} className="btn-primary text-xs">
          {showForm ? '✕ Cancelar' : '+ Nuevo movimiento'}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={()=>setFiltroTipo('')} className={cn('text-xs px-3 py-1 rounded border',!filtroTipo?'bg-input text-white border-input':'bg-base-3 border-base-5 text-lo')}>Todos</button>
        {TIPOS.map(t=>(
          <button key={t} onClick={()=>setFiltroTipo(f=>f===t?'':t)}
            className={cn('text-xs px-3 py-1 rounded border capitalize',filtroTipo===t?'bg-input text-white border-input':'bg-base-3 border-base-5 text-lo hover:border-input hover:text-input')}
          >{t}</button>
        ))}
      </div>

      {/* Resumen stock */}
      {resumenFiltrado.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-5">
          {resumenFiltrado.filter((r:any)=>r.stock_actual>0).map((r:any)=>(
            <div key={r.nombre+r.tipo} className="card-input card p-3">
              <p className="text-[10px] text-mid uppercase tracking-wider">{r.tipo}</p>
              <p className="text-input font-bold text-sm mt-0.5 line-clamp-1">{r.nombre}</p>
              <p className="text-hi font-black text-xl">{fmtNum(r.stock_actual, 1)} <span className="text-xs text-lo">{r.unidad}</span></p>
              {r.costo_total_usd > 0 && <p className="text-xs text-money mt-1">{fmt(r.costo_total_usd)}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card-input card p-5 space-y-4 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Producto *</label>
              <input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} className="field" placeholder="Roundup, DM 4210, Urea..."/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Tipo</label>
              <select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))} className="field">
                {TIPOS.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Movimiento</label>
              <div className="flex gap-1">
                {['entrada','salida'].map(v=>(
                  <button key={v} type="button" onClick={()=>setForm(f=>({...f,movimiento:v}))}
                    className={cn('flex-1 py-2 rounded text-xs border',form.movimiento===v?'bg-input text-white border-input':'bg-base-3 border-base-5 text-mid')}
                  >{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Cantidad *</label>
              <input type="number" step="0.01" value={form.cantidad} onChange={e=>setForm(f=>({...f,cantidad:e.target.value}))} className="field"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Unidad</label>
              <select value={form.unidad} onChange={e=>setForm(f=>({...f,unidad:e.target.value}))} className="field">
                {UNIDADES.map(u=><option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Precio U$S/unidad</label>
              <input type="number" step="0.01" value={form.precio_usd} onChange={e=>setForm(f=>({...f,precio_usd:e.target.value}))} className="field" placeholder="0.00"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Precio $/unidad</label>
              <input type="number" step="1" value={form.precio_ars} onChange={e=>setForm(f=>({...f,precio_ars:e.target.value}))} className="field" placeholder="0"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Proveedor</label>
              <input value={form.proveedor} onChange={e=>setForm(f=>({...f,proveedor:e.target.value}))} className="field" placeholder="Opcional"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Fecha</label>
              <input type="date" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))} className="field"/>
            </div>
          </div>
          {form.movimiento==='salida' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Lote destino</label>
                <input value={form.lote_destino} onChange={e=>setForm(f=>({...f,lote_destino:e.target.value}))} className="field" placeholder="Nombre del lote"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Cultivo</label>
                <input value={form.cultivo} onChange={e=>setForm(f=>({...f,cultivo:e.target.value}))} className="field" placeholder="Soja, Maíz..."/>
              </div>
            </div>
          )}
          {form.cantidad && form.precio_usd && (
            <div className="bg-base-4 rounded px-3 py-2 text-sm">
              <span className="text-mid">Total: </span>
              <span className="text-money font-bold">{fmtUSD(parseFloat(form.cantidad)*parseFloat(form.precio_usd))}</span>
            </div>
          )}
          {err && <p className="text-xs text-red-400 bg-red-950 border border-red-800 rounded px-3 py-2">{err}</p>}
          <button onClick={guardar} disabled={saving} className="btn-primary w-full">{saving?'Guardando…':'Guardar'}</button>
        </div>
      )}

      {/* Historial */}
      {data.length === 0 ? (
        <div className="card p-8 text-center"><p className="text-mid">Sin movimientos de insumos.</p></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-base-4 border-b border-base-5">
              <tr className="text-[10px] uppercase tracking-wider text-lo">
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-center">Mov.</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d:any)=>(
                <tr key={d.id} className="border-b border-base-5 last:border-0 hover:bg-base-4">
                  <td className="px-4 py-3 text-mid text-xs">{d.fecha}</td>
                  <td className="px-4 py-3 font-semibold text-input">{d.nombre}</td>
                  <td className="px-4 py-3 text-xs text-lo capitalize">{d.tipo}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('text-xs font-bold',d.movimiento==='entrada'?'text-money':'text-fuel')}>
                      {d.movimiento==='entrada'?'↓ Entrada':'↑ Salida'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{fmtNum(d.cantidad,2)} {d.unidad}</td>
                  <td className="px-4 py-3 text-right text-xs">
                    {d.precio_usd ? <span className="text-money font-bold">{fmt(d.cantidad*d.precio_usd)}</span> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
