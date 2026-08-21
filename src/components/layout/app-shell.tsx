'use client';
import { useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/(auth)/login/actions';
import { cn } from '@/lib/utils';
import { getCampanaActual } from '@/lib/utils';

type Perfil = { nombre: string; apellido: string | null; razon_social: string | null; tipo_cambio: number; moneda_pref: string };
type Ctx = { campana: string; setCampana: (c: string) => void; moneda: string; setMoneda: (m: string) => void; tipoCambio: number };
const AppCtx = createContext<Ctx>({ campana: '', setCampana: ()=>{}, moneda: 'USD', setMoneda: ()=>{}, tipoCambio: 1000 });
export const useApp = () => useContext(AppCtx);

const TABS = [
  { href: '/dashboard', label: '⬡ Resumen',       color: 'text-ochre' },
  { href: '/granos',    label: '🌾 Granos',        color: 'text-grain' },
  { href: '/insumos',   label: '🧪 Insumos',       color: 'text-input' },
  { href: '/combustible',label: '⛽ Combustible',  color: 'text-fuel' },
  { href: '/finanzas',  label: '💰 Finanzas',      color: 'text-money' },
];

const CAMPANAS = ['2024/2025','2025/2026','2026/2027','2027/2028'];

export function AppShell({ perfil, children }: { perfil: Perfil; children: React.ReactNode }) {
  const pathname = usePathname();
  const [campana, setCampana] = useState(getCampanaActual());
  const [moneda, setMoneda] = useState(perfil.moneda_pref ?? 'USD');
  const [showMenu, setShowMenu] = useState(false);

  const nombre = perfil.razon_social || `${perfil.nombre}${perfil.apellido ? ' ' + perfil.apellido : ''}`;

  return (
    <AppCtx.Provider value={{ campana, setCampana, moneda, setMoneda, tipoCambio: perfil.tipo_cambio ?? 1000 }}>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-[#0d1a0d] border-b border-base-5 relative">
          <div style={{position:'absolute',inset:0,opacity:0.06,backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='42' height='36'%3E%3Cpolygon points='10.5,0 31.5,0 42,18 31.5,36 10.5,36 0,18' fill='none' stroke='%23f59e0b' stroke-width='0.8'/%3E%3C/svg%3E\")",pointerEvents:'none'}} />
          <div className="relative px-5 pt-4 pb-0">
            {/* Top row */}
            <div className="flex items-center justify-between gap-4 pb-3 flex-wrap">
              <div>
                <p className="eyebrow">Mi Campo</p>
                <h1 className="text-ochre font-black text-lg uppercase tracking-wide leading-none mt-0.5">{nombre}</h1>
              </div>

              {/* Campaña + moneda */}
              <div className="flex items-center gap-3">
                <select value={campana} onChange={e=>setCampana(e.target.value)}
                  className="bg-base-3 border border-base-5 text-hi text-xs font-bold rounded-full px-3 py-1.5 focus:outline-none focus:border-ochre">
                  {CAMPANAS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex gap-1 bg-base-3 border border-base-5 rounded-full p-0.5">
                  {['USD','ARS'].map(m=>(
                    <button key={m} onClick={()=>setMoneda(m)}
                      className={cn('text-xs font-bold px-3 py-1 rounded-full transition-all',
                        moneda===m?'bg-ochre text-[#0a0a0a]':'text-lo hover:text-mid')}
                    >{m}</button>
                  ))}
                </div>
              </div>

              {/* Perfil */}
              <div className="relative">
                <button onClick={()=>setShowMenu(v=>!v)} className="text-lo hover:text-mid text-xs border border-base-5 rounded px-3 py-1.5">⚙ Perfil</button>
                {showMenu && (
                  <div className="absolute right-0 mt-1 w-36 card py-1 shadow-lg z-50">
                    <Link href="/perfil" onClick={()=>setShowMenu(false)} className="block px-4 py-2 text-sm text-mid hover:text-hi hover:bg-base-4">Editar perfil</Link>
                    <form action={logout}><button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-base-4">Cerrar sesión</button></form>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <nav className="flex gap-1 -mb-px flex-wrap">
              {TABS.map(tab=>{
                const active = pathname===tab.href || (tab.href!=='/dashboard'&&pathname.startsWith(tab.href));
                return (
                  <Link key={tab.href} href={tab.href}
                    className={cn('px-4 py-2 text-xs font-semibold rounded-t-lg border border-b-0 transition-all',
                      active ? 'bg-ochre text-[#0a0a0a] border-ochre' : 'bg-transparent border-transparent hover:border-base-5 text-mid hover:text-hi')}
                  >{tab.label}</Link>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="flex-1 p-5 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </AppCtx.Provider>
  );
}
