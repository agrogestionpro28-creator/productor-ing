'use client';
import { useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/(auth)/login/actions';
import { cn, getCampanaActual } from '@/lib/utils';

type Perfil = { nombre: string; apellido: string | null; razon_social: string | null; tipo_cambio: number; moneda_pref: string };
type Ctx = { campana: string; setCampana: (c: string) => void; moneda: string; setMoneda: (m: string) => void; tipoCambio: number };
const AppCtx = createContext<Ctx>({ campana: '', setCampana: ()=>{}, moneda: 'USD', setMoneda: ()=>{}, tipoCambio: 1000 });
export const useApp = () => useContext(AppCtx);

const TABS = [
  { href: '/dashboard',    label: 'Resumen',     icon: '⊞' },
  { href: '/granos',       label: 'Granos',      icon: '🌾' },
  { href: '/insumos',      label: 'Insumos',     icon: '🧪' },
  { href: '/combustible',  label: 'Combustible', icon: '⛽' },
  { href: '/finanzas',     label: 'Finanzas',    icon: '💰' },
];

const CAMPANAS = ['2024/2025','2025/2026','2026/2027','2027/2028'];

export function AppShell({ perfil, children }: { perfil: Perfil; children: React.ReactNode }) {
  const pathname = usePathname();
  const [campana, setCampana] = useState(getCampanaActual());
  const [moneda, setMoneda] = useState(perfil.moneda_pref ?? 'USD');
  const [showMenu, setShowMenu] = useState(false);

  const nombre = perfil.razon_social || `${perfil.nombre}${perfil.apellido ? ' ' + perfil.apellido : ''}`;
  const initials = nombre.split(' ').map((n:string) => n[0]).slice(0,2).join('').toUpperCase();

  return (
    <AppCtx.Provider value={{ campana, setCampana, moneda, setMoneda, tipoCambio: perfil.tipo_cambio ?? 1000 }}>
      <div className="min-h-screen flex flex-col" style={{ background: '#080808' }}>

        {/* TOP HEADER */}
        <header className="sticky top-0 z-40 border-b border-white/8"
          style={{ background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center justify-between px-6 py-3">
            {/* Brand + nombre */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000' }}>
                MC
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">{nombre}</p>
                <p className="text-white/30 text-[10px] uppercase tracking-wider">Productor</p>
              </div>
            </div>

            {/* Center: campaña */}
            <div className="flex items-center gap-2">
              <select value={campana} onChange={e=>setCampana(e.target.value)}
                className="text-xs font-bold text-white bg-white/8 border border-white/10 rounded-full px-3 py-1.5 focus:outline-none focus:border-[#f59e0b] cursor-pointer appearance-none">
                {CAMPANAS.map(c=><option key={c} value={c} style={{background:'#111'}}>{c}</option>)}
              </select>
            </div>

            {/* Right: moneda + perfil */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 bg-white/8 border border-white/10 rounded-full p-0.5">
                {['USD','ARS'].map(m=>(
                  <button key={m} onClick={()=>setMoneda(m)}
                    className={cn('text-xs font-bold px-3 py-1 rounded-full transition-all',
                      moneda===m ? 'bg-[#f59e0b] text-black' : 'text-white/40 hover:text-white/70')}
                  >{m}</button>
                ))}
              </div>

              <div className="relative">
                <button onClick={()=>setShowMenu(v=>!v)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-black"
                  style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                  {initials}
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 overflow-hidden z-50"
                    style={{ background: 'rgba(20,20,20,0.97)', backdropFilter: 'blur(20px)' }}>
                    <Link href="/perfil" onClick={()=>setShowMenu(false)}
                      className="block px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                      ⚙ Editar perfil
                    </Link>
                    <form action={logout}>
                      <button className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors border-t border-white/10">
                        → Cerrar sesión
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MODULE TABS — desktop */}
          <nav className="flex gap-1 px-6 pb-0 hidden md:flex">
            {TABS.map(tab => {
              const active = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href));
              return (
                <Link key={tab.href} href={tab.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all',
                    active
                      ? 'border-[#f59e0b] text-[#f59e0b]'
                      : 'border-transparent text-white/30 hover:text-white/70 hover:border-white/20'
                  )}>
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full pb-24 md:pb-6">
          {children}
        </main>

        {/* BOTTOM NAV — mobile */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t border-white/10"
          style={{ background: 'rgba(8,8,8,0.98)', backdropFilter: 'blur(20px)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {TABS.map(tab => {
            const active = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href));
            return (
              <Link key={tab.href} href={tab.href}
                className={cn('flex-1 flex flex-col items-center gap-1 py-3 transition-all',
                  active ? 'text-[#f59e0b]' : 'text-white/30')}>
                <span className="text-xl">{tab.icon}</span>
                <span className="text-[9px] uppercase tracking-wider font-bold">{tab.label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-[#f59e0b]" />}
              </Link>
            );
          })}
        </nav>
      </div>
    </AppCtx.Provider>
  );
}
