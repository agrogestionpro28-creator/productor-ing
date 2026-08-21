'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/components/layout/app-shell';
import { fmtNum, fmtUSD, fmtARS } from '@/lib/utils';
import { cn } from '@/lib/utils';

const CULTIVOS = ['Soja','Maíz','Trigo','Girasol','Sorgo','Cebada','Otro'];
const TIPOS = ['cosecha','venta','consumo','ajuste'];
const DESTINOS = ['silo_propio','acopio','venta_directa'];
const VACIO = { campana:'', cultivo:'', lote_nombre:'', fecha:new Date().toISOString().slice(0,10), tipo:'cosecha', cantidad_tn:'', destino:'silo_propio', acopio:'', precio_usd:'', precio_ars:'', observaciones:'' };

export function GranosClient({ data: initial, resumen: resumenInit, userId }: any) {
  const { campana, moneda, tipoCambio } = useApp();
  const [data, setData] = useState(initial);
  const [resumen, setResumen] = useState(resumenInit);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...VACIO, campana });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const resumenCamp = resumen.filter((r: any) => r.campana === campana);
  const dataCamp = data.filter((d: any) => d.campana === campana);
  const fmt = (usd: number) => moneda === 'USD' ? fmtUSD(usd) : fmtARS(usd * tipoCambio);

  async function guardar() {
    if (!form.cantidad_tn || !form.cultivo) { setErr('Cultivo y cantidad son obligatorios'); return; }
    setSaving(true); setErr('');
    const cantNum = parseFloat(form.cantidad_tn);
    const { error } = await (createClient() as any).from('stock_granos').insert({
      productor_id: userId, campana: form.campana || campana,
      cultivo: form.cultivo, lote_nombre: form.lote_nombre || null,
      fecha: form.fecha, tipo: form.tipo,
      cantidad_tn: form.tipo === 'venta' || form.tipo === 'consumo' ? -Math.abs(cantNum) : cantNum,
      destino: form.destino || null, acopio: form.acopio || null,
      precio_usd: form.precio_usd ? parseFloat(form.precio_usd) : null,
      precio_ars: form.precio_ars ? parseFloat(form.precio_ars) : null,
      observaciones: form.observaciones || null,
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    const [{ data: d }, { data: r }] = await Promise.all([
      (createClient() as any).from('stock_granos').select('*').eq('productor_id', userId).order('fecha', { ascending: false }),
      (createClient() as any).from('vw_stock_granos').select('*').eq('productor_id', userId),
    ]);
    setData(d ?? []); setResumen(r ?? []);
    setForm({ ...VACIO, campana }); setShowForm(false); setSaving(false);
  }

  const tipoColor: Record<string,string> = { cosecha:'text-grain', venta:'text-money', consumo:'text-fuel', ajuste:'text-mid' };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <div><p className="eyebrow mb-1">Stock</p><h2 className="text-xl font-bold text-hi">Granos — {campana}</h2></div>
        <button onClick={()=>setShowForm(!showForm)} className="btn-primary text-xs">
          {showForm ? '✕ Cancelar' : '+ Nuevo movimiento'}
        </button>
      </div>

      {/* Resumen por cultivo */}
      {resumenCamp.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
          {resumenCamp.map((r: any) => (
            <div key={r.cultivo} className="card-grain card p-4">
              <p className="text-xs text-mid uppercase tracking-wider mb-1">{r.cultivo}</p>
              <p className="text-grain font-black text-2xl">{fmtNum(r.stock_actual_tn, 1)} tn</p>
              <div className="text-[10px] text-lo mt-2 space-y-0.5">
                <p>Cosecha: {fmtNum(r.cosechado_tn, 1)} tn</p>
                <p>Vendido: {fmtNum(r.vendido_tn, 1)} tn</p>
                {r.ingreso_usd > 0 && <p className="text-money">{fmt(r.ingreso_usd)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario nuevo movimiento */}
      {showForm && (
        <div className="card-grain card p-5 space-y-4 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Campaña</label>
              <select value={form.campana||campana} onChange={e=>setForm(f=>({...f,campana:e.target.value}))} className="field">
                {['2024/2025','2025/2026','2026/2027','2027/2028'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Fecha</label>
              <input type="date" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))} className="field"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Cultivo *</label>
              <select value={form.cultivo} onChange={e=>setForm(f=>({...f,cultivo:e.target.value}))} className="field">
                <option value="">—</option>
                {CULTIVOS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Tipo *</label>
              <select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))} className="field">
                {TIPOS.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Cantidad (tn) *</label>
              <input type="number" step="0.001" value={form.cantidad_tn} onChange={e=>setForm(f=>({...f,cantidad_tn:e.target.value}))} className="field" placeholder="0.000"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Lote (opcional)</label>
              <input value={form.lote_nombre} onChange={e=>setForm(f=>({...f,lote_nombre:e.target.value}))} className="field" placeholder="Nombre del lote"/>
            </div>
          </div>
          {(form.tipo==='venta'||form.tipo==='cosecha') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">
                  Precio U$S/tn {form.tipo==='venta'?'':'(opcional)'}
                </label>
                <input type="number" step="0.01" value={form.precio_usd} onChange={e=>setForm(f=>({...f,precio_usd:e.target.value}))} className="field" placeholder="0.00"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Precio $/tn (opcional)</label>
                <input type="number" step="1" value={form.precio_ars} onChange={e=>setForm(f=>({...f,precio_ars:e.target.value}))} className="field" placeholder="0"/>
              </div>
            </div>
          )}
          {form.tipo==='venta' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Destino</label>
                <select value={form.destino} onChange={e=>setForm(f=>({...f,destino:e.target.value}))} className="field">
                  {DESTINOS.map(d=><option key={d} value={d}>{d.replace('_',' ')}</option>)}
                </select>
              </div>
              {form.destino==='acopio' && (
                <div>
                  <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Nombre acopio</label>
                  <input value={form.acopio} onChange={e=>setForm(f=>({...f,acopio:e.target.value}))} className="field"/>
                </div>
              )}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Observaciones</label>
            <input value={form.observaciones} onChange={e=>setForm(f=>({...f,observaciones:e.target.value}))} className="field"/>
          </div>
          {/* Cálculo automático */}
          {form.cantidad_tn && form.precio_usd && (
            <div className="bg-base-4 rounded px-3 py-2 text-sm">
              <span className="text-mid">Total estimado: </span>
              <span className="text-money font-bold">{fmt(parseFloat(form.cantidad_tn)*parseFloat(form.precio_usd))}</span>
            </div>
          )}
          {err && <p className="text-xs text-red-400 bg-red-950 border border-red-800 rounded px-3 py-2">{err}</p>}
          <button onClick={guardar} disabled={saving} className="btn-primary w-full">
            {saving?'Guardando…':'Guardar movimiento'}
          </button>
        </div>
      )}

      {/* Historial */}
      {dataCamp.length === 0 ? (
        <div className="card p-8 text-center"><p className="text-mid">Sin movimientos para {campana}.</p></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-base-4 border-b border-base-5">
              <tr className="text-[10px] uppercase tracking-wider text-lo">
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Cultivo</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {dataCamp.map((d: any) => {
                const total = d.precio_usd ? Math.abs(d.cantidad_tn)*d.precio_usd : null;
                return (
                  <tr key={d.id} className="border-b border-base-5 last:border-0 hover:bg-base-4">
                    <td className="px-4 py-3 text-mid text-xs">{d.fecha}</td>
                    <td className="px-4 py-3 font-semibold text-grain">{d.cultivo}</td>
                    <td className="px-4 py-3"><span className={cn('text-xs font-bold', tipoColor[d.tipo]??'text-mid')}>{d.tipo}</span></td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={d.cantidad_tn < 0 ? 'text-fuel' : 'text-grain'}>
                        {d.cantidad_tn > 0 ? '+' : ''}{fmtNum(d.cantidad_tn, 3)} tn
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-mid">{d.precio_usd ? fmtUSD(d.precio_usd)+'/tn' : '—'}</td>
                    <td className="px-4 py-3 text-right font-bold">{total ? <span className="text-money">{fmt(total)}</span> : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
