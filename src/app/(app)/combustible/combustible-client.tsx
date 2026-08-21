'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/components/layout/app-shell';
import { fmtNum, fmtUSD, fmtARS, cn } from '@/lib/utils';

const EQUIPOS = ['Tractor','Cosechadora','Camión','Pulverizadora','Sembradora','Otro'];
const VACIO = { fecha:new Date().toISOString().slice(0,10), tipo:'gasoil', movimiento:'carga', litros:'', precio_lt_usd:'', precio_lt_ars:'', equipo:'Tractor', proveedor:'', observaciones:'' };

export function CombustibleClient({ data: initial, resumen: resumenInit, userId }: any) {
  const { moneda, tipoCambio } = useApp();
  const [data, setData] = useState(initial);
  const [resumen, setResumen] = useState(resumenInit);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({...VACIO});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const fmt = (usd: number) => moneda === 'USD' ? fmtUSD(usd) : fmtARS(usd * tipoCambio);

  const gasoil = resumen.find((r:any)=>r.tipo==='gasoil');
  const nafta  = resumen.find((r:any)=>r.tipo==='nafta');

  async function guardar() {
    if (!form.litros) { setErr('Litros es obligatorio'); return; }
    setSaving(true); setErr('');
    const { error } = await (createClient() as any).from('stock_combustible').insert({
      productor_id: userId, fecha: form.fecha, tipo: form.tipo,
      movimiento: form.movimiento, litros: parseFloat(form.litros),
      precio_lt_usd: form.precio_lt_usd ? parseFloat(form.precio_lt_usd) : null,
      precio_lt_ars: form.precio_lt_ars ? parseFloat(form.precio_lt_ars) : null,
      equipo: form.equipo || null, proveedor: form.proveedor || null,
      observaciones: form.observaciones || null,
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    const [{ data: d }, { data: r }] = await Promise.all([
      (createClient() as any).from('stock_combustible').select('*').eq('productor_id', userId).order('fecha', { ascending: false }),
      (createClient() as any).from('vw_stock_combustible').select('*').eq('productor_id', userId),
    ]);
    setData(d ?? []); setResumen(r ?? []);
    setForm({...VACIO}); setShowForm(false); setSaving(false);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <div><p className="eyebrow mb-1">Stock</p><h2 className="text-xl font-bold text-hi">Combustible</h2></div>
        <button onClick={()=>setShowForm(!showForm)} className="btn-primary text-xs">{showForm?'✕ Cancelar':'+ Nuevo movimiento'}</button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {[
          { label:'Gasoil', data:gasoil, color:'text-fuel' },
          { label:'Nafta',  data:nafta,  color:'text-orange-400' },
        ].map(({label,data:d,color})=>(
          <div key={label} className="card-fuel card p-5">
            <p className="text-xs text-mid uppercase tracking-wider mb-1">{label}</p>
            <p className={`font-black text-3xl ${color}`}>{d ? fmtNum(d.stock_lt,0) : '0'} <span className="text-sm font-normal text-lo">lt</span></p>
            {d?.costo_usd > 0 && <p className="text-xs text-money mt-2">Invertido: {fmt(d.costo_usd)}</p>}
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card-fuel card p-5 space-y-4 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Tipo</label>
              <div className="flex gap-1">
                {['gasoil','nafta'].map(v=>(
                  <button key={v} type="button" onClick={()=>setForm(f=>({...f,tipo:v}))}
                    className={cn('flex-1 py-2 rounded text-xs border capitalize',form.tipo===v?'bg-fuel text-white border-fuel':'bg-base-3 border-base-5 text-mid')}
                  >{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Movimiento</label>
              <div className="flex gap-1">
                {['carga','consumo'].map(v=>(
                  <button key={v} type="button" onClick={()=>setForm(f=>({...f,movimiento:v}))}
                    className={cn('flex-1 py-2 rounded text-xs border capitalize',form.movimiento===v?'bg-fuel text-white border-fuel':'bg-base-3 border-base-5 text-mid')}
                  >{v}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Litros *</label>
              <input type="number" step="0.1" value={form.litros} onChange={e=>setForm(f=>({...f,litros:e.target.value}))} className="field"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">U$S/lt</label>
              <input type="number" step="0.001" value={form.precio_lt_usd} onChange={e=>setForm(f=>({...f,precio_lt_usd:e.target.value}))} className="field" placeholder="0.000"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">$/lt</label>
              <input type="number" step="1" value={form.precio_lt_ars} onChange={e=>setForm(f=>({...f,precio_lt_ars:e.target.value}))} className="field" placeholder="0"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Equipo</label>
              <select value={form.equipo} onChange={e=>setForm(f=>({...f,equipo:e.target.value}))} className="field">
                {EQUIPOS.map(e=><option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Fecha</label>
              <input type="date" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))} className="field"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Proveedor</label>
            <input value={form.proveedor} onChange={e=>setForm(f=>({...f,proveedor:e.target.value}))} className="field" placeholder="Opcional"/>
          </div>
          {form.litros && form.precio_lt_usd && (
            <div className="bg-base-4 rounded px-3 py-2 text-sm">
              <span className="text-mid">Total: </span>
              <span className="text-money font-bold">{fmt(parseFloat(form.litros)*parseFloat(form.precio_lt_usd))}</span>
            </div>
          )}
          {err && <p className="text-xs text-red-400 bg-red-950 border border-red-800 rounded px-3 py-2">{err}</p>}
          <button onClick={guardar} disabled={saving} className="btn-primary w-full">{saving?'Guardando…':'Guardar'}</button>
        </div>
      )}

      {/* Historial */}
      {data.length === 0 ? (
        <div className="card p-8 text-center"><p className="text-mid">Sin movimientos.</p></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-base-4 border-b border-base-5">
              <tr className="text-[10px] uppercase tracking-wider text-lo">
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Movimiento</th>
                <th className="px-4 py-3 text-left">Equipo</th>
                <th className="px-4 py-3 text-right">Litros</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d:any)=>(
                <tr key={d.id} className="border-b border-base-5 last:border-0 hover:bg-base-4">
                  <td className="px-4 py-3 text-mid text-xs">{d.fecha}</td>
                  <td className="px-4 py-3 text-fuel font-semibold capitalize">{d.tipo}</td>
                  <td className="px-4 py-3 text-xs capitalize"><span className={cn(d.movimiento==='carga'?'text-money':'text-fuel')}>{d.movimiento}</span></td>
                  <td className="px-4 py-3 text-xs text-mid">{d.equipo ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{fmtNum(d.litros,1)} lt</td>
                  <td className="px-4 py-3 text-right text-xs">
                    {d.precio_lt_usd ? <span className="text-money font-bold">{fmt(d.litros*d.precio_lt_usd)}</span> : '—'}
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
