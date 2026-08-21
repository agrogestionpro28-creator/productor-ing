'use client';
import Link from 'next/link';
import { useApp } from '@/components/layout/app-shell';
import { fmtUSD, fmtARS, fmtNum } from '@/lib/utils';

export function DashboardClient({ granos, insumos, combustible, movimientos, tipoCambio }: any) {
  const { campana, moneda } = useApp();

  const granosCamp = granos.filter((g: any) => g.campana === campana);
  const movsCamp   = movimientos.filter((m: any) => m.campana === campana);

  const totalGranosTn   = granosCamp.reduce((s: number, g: any) => s + Number(g.stock_actual_tn ?? 0), 0);
  const totalIngresoUSD = movsCamp.reduce((s: number, m: any) => s + Number(m.ingresos_usd ?? 0), 0);
  const totalEgresoUSD  = movsCamp.reduce((s: number, m: any) => s + Number(m.egresos_usd ?? 0), 0);
  const margenUSD = totalIngresoUSD - totalEgresoUSD;
  const totalStockInsumos = insumos.length;
  const totalCombustible  = combustible.reduce((s: number, c: any) => s + Number(c.stock_lt ?? 0), 0);

  const fmt = (usd: number) => moneda === 'USD' ? fmtUSD(usd) : fmtARS(usd * tipoCambio);

  const modules = [
    {
      href: '/granos',
      label: 'Libro de Granos',
      icon: '🌾',
      bg: '/granos-bg.png',
      accent: '#f59e0b',
      value: `${fmtNum(totalGranosTn, 1)} tn`,
      sub: `${granosCamp.length} cultivos`,
      detail: granosCamp.slice(0,3).map((g:any)=>({
        name: g.cultivo,
        value: `${fmtNum(g.stock_actual_tn,1)} tn`,
        color: '#f59e0b',
      })),
    },
    {
      href: '/insumos',
      label: 'Stock de Insumos',
      icon: '🧪',
      bg: '/insumos-bg.png',
      accent: '#818cf8',
      value: `${totalStockInsumos} productos`,
      sub: 'Agroquímicos · Semillas · Fertilizantes',
      detail: [],
    },
    {
      href: '/combustible',
      label: 'Combustible',
      icon: '⛽',
      bg: '/combustible-bg.png',
      accent: '#f87171',
      value: `${fmtNum(totalCombustible, 0)} lt`,
      sub: 'Stock disponible',
      detail: [],
    },
    {
      href: '/finanzas',
      label: 'Finanzas',
      icon: '💰',
      bg: '/finanzas-bg.png',
      accent: margenUSD >= 0 ? '#34d399' : '#f87171',
      value: fmt(margenUSD),
      sub: `Margen bruto campaña ${campana}`,
      detail: [
        { name: 'Ingresos', value: fmt(totalIngresoUSD), color: '#34d399' },
        { name: 'Egresos',  value: fmt(totalEgresoUSD),  color: '#f87171' },
      ],
    },
  ];

  return (
    <div>
      {/* Hero header */}
      <div className="relative rounded-2xl overflow-hidden mb-8 h-48"
        style={{ backgroundImage: 'url(/dashboard-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-8">
          <p className="text-[#f59e0b] text-xs font-bold tracking-[0.2em] uppercase mb-2">Campaña activa</p>
          <h1 className="text-4xl font-black text-white mb-1">{campana}</h1>
          <p className="text-white/60 text-sm">Panel de gestión del establecimiento</p>
        </div>
        {/* Stats row */}
        <div className="absolute bottom-0 left-0 right-0 flex divide-x divide-white/10">
          {[
            { label: 'Hectáreas', value: '—', color: '#34d399' },
            { label: 'Stock granos', value: `${fmtNum(totalGranosTn,1)} tn`, color: '#f59e0b' },
            { label: 'Margen bruto', value: fmt(margenUSD), color: margenUSD >= 0 ? '#34d399' : '#f87171' },
          ].map(s => (
            <div key={s.label} className="flex-1 px-6 py-3 bg-black/40 backdrop-blur-sm">
              <p className="text-white/40 text-[10px] uppercase tracking-wider">{s.label}</p>
              <p className="font-black text-lg" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Module cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {modules.map(m => (
          <Link key={m.href} href={m.href}
            className="group relative rounded-2xl overflow-hidden cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-2xl"
            style={{ minHeight: 260 }}>
            {/* Background image */}
            <div className="absolute inset-0"
              style={{ backgroundImage: `url(${m.bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
            {/* Accent border top */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: m.accent }} />

            {/* Content */}
            <div className="relative h-full flex flex-col justify-between p-5" style={{ minHeight: 260 }}>
              {/* Top */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-white/30 text-xs group-hover:text-white/60 transition-colors">→</span>
                </div>
                <p className="text-white/60 text-xs uppercase tracking-wider">{m.label}</p>
              </div>

              {/* Middle: detail rows */}
              <div className="space-y-1">
                {m.detail.map((d: any) => (
                  <div key={d.name} className="flex justify-between text-xs">
                    <span className="text-white/50">{d.name}</span>
                    <span className="font-bold" style={{ color: d.color }}>{d.value}</span>
                  </div>
                ))}
              </div>

              {/* Bottom: main value */}
              <div>
                <p className="font-black text-3xl text-white leading-none mb-1">{m.value}</p>
                <p className="text-white/40 text-xs">{m.sub}</p>
              </div>
            </div>

            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ boxShadow: `inset 0 0 40px ${m.accent}33` }} />
          </Link>
        ))}
      </div>

      {/* Granos por cultivo */}
      {granosCamp.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-white/10"
          style={{ background: 'rgba(15,15,15,0.8)', backdropFilter: 'blur(12px)' }}>
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#f59e0b] font-bold tracking-[0.2em] uppercase">Libro de granos</p>
              <h3 className="text-white font-bold text-lg">Posición por cultivo — {campana}</h3>
            </div>
            <Link href="/granos" className="text-xs text-white/40 hover:text-white transition-colors">Ver todo →</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/10">
            {granosCamp.map((g: any) => {
              const pct = g.cosechado_tn > 0 ? (g.vendido_tn / g.cosechado_tn) * 100 : 0;
              const COLORS: Record<string,string> = {
                Soja:'#22c55e', Maíz:'#84cc16', Trigo:'#f59e0b', Girasol:'#38bdf8',
                Sorgo:'#ea580c', Cebada:'#fbbf24',
              };
              const color = COLORS[g.cultivo] ?? '#a3a3a3';
              return (
                <div key={g.cultivo} className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color }}>{g.cultivo}</p>
                  <p className="text-3xl font-black text-white mb-0.5">{fmtNum(g.stock_actual_tn, 1)}</p>
                  <p className="text-white/40 text-xs mb-4">tn en stock</p>
                  {/* Progress bar sold */}
                  <div className="mb-2">
                    <div className="flex justify-between text-[10px] text-white/40 mb-1">
                      <span>Vendido</span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/40">Cosechado</span>
                      <span className="text-white/70">{fmtNum(g.cosechado_tn,1)} tn</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Vendido</span>
                      <span className="text-white/70">{fmtNum(g.vendido_tn,1)} tn</span>
                    </div>
                    {g.ingreso_usd > 0 && (
                      <div className="flex justify-between pt-1 border-t border-white/10">
                        <span className="text-white/40">Ingreso</span>
                        <span className="font-bold" style={{ color }}>{fmt(g.ingreso_usd)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {granosCamp.length === 0 && movsCamp.length === 0 && (
        <div className="rounded-2xl border border-white/10 p-12 text-center"
          style={{ background: 'rgba(15,15,15,0.6)' }}>
          <p className="text-5xl mb-4">🌱</p>
          <p className="text-white/60 text-lg font-semibold mb-2">Campaña {campana} sin datos aún</p>
          <p className="text-white/30 text-sm">Comenzá cargando el stock de granos o los insumos del ciclo.</p>
        </div>
      )}
    </div>
  );
}
