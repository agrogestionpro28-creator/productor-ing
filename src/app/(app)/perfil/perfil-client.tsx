'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function PerfilClient({ perfil: initial, userId }: any) {
  const [form, setForm] = useState({
    nombre: initial?.nombre??'', apellido: initial?.apellido??'',
    razon_social: initial?.razon_social??'', cuit: initial?.cuit??'',
    telefono: initial?.telefono??'', localidad: initial?.localidad??'',
    tipo_cambio: String(initial?.tipo_cambio??1000),
    moneda_pref: initial?.moneda_pref??'USD',
  });
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');

  async function guardar() {
    setSaving(true); setOk(false); setErr('');
    const { error } = await (createClient() as any).from('productores_perfil').update({
      nombre: form.nombre, apellido: form.apellido||null,
      razon_social: form.razon_social||null, cuit: form.cuit||null,
      telefono: form.telefono||null, localidad: form.localidad||null,
      tipo_cambio: parseFloat(form.tipo_cambio)||1000,
      moneda_pref: form.moneda_pref,
    }).eq('id', userId);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setOk(true);
  }

  return (
    <div className="max-w-lg mx-auto">
      <p className="eyebrow mb-1">Configuración</p>
      <h2 className="text-xl font-bold text-hi mb-6">Tu perfil</h2>
      <div className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Nombre *</label><input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} className="field"/></div>
          <div><label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Apellido</label><input value={form.apellido} onChange={e=>setForm(f=>({...f,apellido:e.target.value}))} className="field"/></div>
        </div>
        <div><label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Razón social</label><input value={form.razon_social} onChange={e=>setForm(f=>({...f,razon_social:e.target.value}))} className="field"/></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">CUIT</label><input value={form.cuit} onChange={e=>setForm(f=>({...f,cuit:e.target.value}))} className="field"/></div>
          <div><label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Localidad</label><input value={form.localidad} onChange={e=>setForm(f=>({...f,localidad:e.target.value}))} className="field"/></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Tipo de cambio (ARS/USD)</label>
            <input type="number" step="1" value={form.tipo_cambio} onChange={e=>setForm(f=>({...f,tipo_cambio:e.target.value}))} className="field" placeholder="1000"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-mid mb-1 uppercase tracking-wider">Moneda preferida</label>
            <div className="flex gap-1 mt-1">
              {['USD','ARS'].map(m=>(
                <button key={m} type="button" onClick={()=>setForm(f=>({...f,moneda_pref:m}))}
                  className={`flex-1 py-2 rounded text-xs border ${form.moneda_pref===m?'bg-ochre text-[#0a0a0a] border-ochre':'bg-base-3 border-base-5 text-mid'}`}
                >{m}</button>
              ))}
            </div>
          </div>
        </div>
        {err && <p className="text-xs text-red-400 bg-red-950 border border-red-800 rounded px-3 py-2">{err}</p>}
        {ok && <p className="text-xs text-money bg-[#0a1a12] border border-money/30 rounded px-3 py-2">✓ Perfil guardado</p>}
        <button onClick={guardar} disabled={saving} className="btn-primary w-full">{saving?'Guardando…':'Guardar perfil'}</button>
      </div>
    </div>
  );
}
