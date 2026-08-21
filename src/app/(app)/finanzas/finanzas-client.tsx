'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/components/layout/app-shell';
import { fmtNum, fmtUSD, fmtARS, cn } from '@/lib/utils';

const CATEGORIAS_ING = ['venta_granos','subsidio','otro_ingreso'];
const CATEGORIAS_EG  = ['labor','insumo','combustible','arrendamiento','honorario_ing','seguro','impuesto','otro_egreso'];
const VACIO = { campana:'', fecha:new Date().toISOString().slice(0,10), tipo:'egreso', categoria:'labor', concepto:'', cultivo:'', lote:'', monto_usd:'', monto_ars:'', observaciones:'' };

export function FinanzasClient({ movimientos: initial, margen: margenInit, userId }: any) {
  const { campana, moneda, tipoCambio } = useApp();
  const [movimientos, setMovimientos] = useState(initial);
  const [margen, setMargen] = useState(margenInit);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({...VACIO, campana});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const fmt  = (usd: number) => moneda === 'USD' ? fmtUSD(usd) : fmtARS(usd * tipoCambio);
  const movsCamp   = movimientos.filter((m:any)=>m.campana===campana);
  const margenCamp = margen.filter((m:any)=>m.campana===campana);

  const totalIng = margenCamp.reduce((s:number,m:any)=>s+Number(m.ingresos_usd??0),0);
  const totalEg  = margenCamp.reduce((s:number,m:any)=>s+Number(m.egresos_usd??0),0);
  const totalMb  = totalIng - totalEg;

  async function guardar() {
    if (!form.concepto || (!form.monto_usd && !form.monto_ars)) { setErr('Concepto y monto son obligatorios'); return; }
    setSaving(true); setErr('');
    const { error } = await (createClient() as any).from('movimientos').insert({
      productor_id: userId, campana: form.campana||campana,
      fecha: form.fecha, tipo: form.tipo, categoria: form.categoria,
      concepto: form.concepto.trim(), cultivo: form.cultivo||null, lote: form.lote||null,
      monto_usd: form.monto_usd ? parseFloat(form.monto_usd) : null,
      monto_ars: form.monto_ars ? parseFloat(form.monto_ars) : null,
      observaciones: form.observaciones||null,
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    const [{ data: m }, { data: mb }] = await Promise.all([
      (createClient() as any).from('movimientos').select('*').eq('productor_id', userId).order('fecha', { ascending: false }),
      (createClient() as any).from('vw_margen_bruto').select('*').eq('productor_id', userId),
    ]);
    setMovimientos(m??[]); setMargen(mb??[]);
    setForm({...VACIO,campana}); setShowForm(false); setSaving(false);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <div><p className="eyebrow mb-1">Gestión</p><h2 className="text-xl font-bold text-hi">Finanzas — {campana}</h2></div>
        <button onClick={()=>setShowForm(!showForm)} className="btn-primary text-xs">{showForm?'✕ Cancelar':'+ Movimiento'}</button>
      </div>

      {/* Margen bruto resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:'Ingresos', value:totalIng, color:'text-money', bg:'bg-[#0a1a12] border-money/30' },
          { label:'Egresos',  value:totalEg,  color:'text-fuel',  bg:'bg-[#1a1010] border-fuel/30' },
          { label:'Margen bruto', value:totalMb, color:totalMb>=0?'text-money':'text-fuel', bg:totalMb>=0?'bg-[#0a1a12] border-money/30':'bg-[#1a0a0a] border-red-600/30' },
        ].map(({label,value,color,bg})=>(
          <div key={label} className={`card ${bg} p-5 text-center`}>
            <p className="text-xs text-mid uppercase tracking-wider mb-2">{label}</p>
            <p className={`font-black text-2xl ${color}`}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Margen por cultivo */}
      {margenCamp.filter((m:any)=>m.cultivo).length > 0 && (
        <div className="card p-5 mb-5">
          <p className="eyebrow mb-3">Por cultivo</p>
          <div className="space-y-2">
            {margenCamp.filter((m:any)=>m.cultivo).map((m:any)=>{
              const mb = Number(m.margen_usd??0);
              return (
                <div key={m.cultivo} className="flex items-center justify-between py-2 border-b border-base-5 last:border-0">
                  <span className="font-semibold text-hi">{m.cultivo}</span>
                  <div className="flex gap-6 text-sm">
                    <span className="text-money">{fmt(m.ingresos_usd??0)}</span>
                    <span className="text-fuel">-{fmt(m.egresos_usd??0)}</span>
                    <span className={cn('font-black', mb>=0?'text-money':'text-fuel')}>{fmt(mb)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card-money card p-5 space-y-4 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Tipo</label>
              <div className="flex gap-1">
                {['ingreso','egreso'].map(v=>(
                  <button key={v} type="button" onClick={()=>setForm(f=>({...f,tipo:v,categoria:v==='ingreso'?'venta_granos':'labor'}))}
                    className={cn('flex-1 py-2 rounded text-xs border capitalize',form.tipo===v?(v==='ingreso'?'bg-money text-[#0a0a0a] border-money':'bg-fuel text-white border-fuel'):'bg-base-3 border-base-5 text-mid')}
                  >{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Categoría</label>
              <select value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))} className="field">
                {(form.tipo==='ingreso'?CATEGORIAS_ING:CATEGORIAS_EG).map(c=>(
                  <option key={c} value={c}>{c.replace(/_/g,' ')}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Concepto *</label>
            <input value={form.concepto} onChange={e=>setForm(f=>({...f,concepto:e.target.value}))} className="field" placeholder="Descripción del movimiento"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Monto U$S</label>
              <input type="number" step="0.01" value={form.monto_usd} onChange={e=>setForm(f=>({...f,monto_usd:e.target.value}))} className="field" placeholder="0.00"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Monto $</label>
              <input type="number" step="1" value={form.monto_ars} onChange={e=>setForm(f=>({...f,monto_ars:e.target.value}))} className="field" placeholder="0"/>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Campaña</label>
              <select value={form.campana||campana} onChange={e=>setForm(f=>({...f,campana:e.target.value}))} className="field">
                {['2024/2025','2025/2026','2026/2027','2027/2028'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Cultivo</label>
              <input value={form.cultivo} onChange={e=>setForm(f=>({...f,cultivo:e.target.value}))} className="field" placeholder="Opcional"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Fecha</label>
              <input type="date" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))} className="field"/>
            </div>
          </div>
          {err && <p className="text-xs text-red-400 bg-red-950 border border-red-800 rounded px-3 py-2">{err}</p>}
          <button onClick={guardar} disabled={saving} className="btn-primary w-full">{saving?'Guardando…':'Guardar movimiento'}</button>
        </div>
      )}

      {/* Historial */}
      {movsCamp.length === 0 ? (
        <div className="card p-8 text-center"><p className="text-mid">Sin movimientos para {campana}.</p></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-base-4 border-b border-base-5">
              <tr className="text-[10px] uppercase tracking-wider text-lo">
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Concepto</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-left">Cultivo</th>
                <th className="px-4 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {movsCamp.map((m:any)=>(
                <tr key={m.id} className="border-b border-base-5 last:border-0 hover:bg-base-4">
                  <td className="px-4 py-3 text-mid text-xs">{m.fecha}</td>
                  <td className="px-4 py-3 font-semibold text-hi">{m.concepto}</td>
                  <td className="px-4 py-3 text-xs text-lo">{m.categoria?.replace(/_/g,' ')}</td>
                  <td className="px-4 py-3 text-xs text-mid">{m.cultivo??'—'}</td>
                  <td className="px-4 py-3 text-right font-bold">
                    <span className={m.tipo==='ingreso'?'text-money':'text-fuel'}>
                      {m.tipo==='egreso'?'-':''}{fmt(m.monto_usd??0)}
                    </span>
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
