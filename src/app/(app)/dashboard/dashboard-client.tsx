'use client';
import Link from 'next/link';
import { useApp } from '@/components/layout/app-shell';
import { fmtUSD, fmtARS, fmtNum } from '@/lib/utils';

export function DashboardClient({ granos, insumos, combustible, movimientos, tipoCambio }: any) {
  const { campana, moneda } = useApp();

  const granosCamp = granos.filter((g: any) => g.campana === campana);
  const movsCamp   = movimientos.filter((m: any) => m.campana === campana);

  const totalGranosTn = granosCamp.reduce((s: number, g: any) => s + Number(g.stock_actual_tn ?? 0), 0);
  const totalIngresoUSD = movsCamp.reduce((s: number, m: any) => s + Number(m.ingresos_usd ?? 0), 0);
  const totalEgresoUSD  = movsCamp.reduce((s: number, m: any) => s + Number(m.egresos_usd ?? 0), 0);
  const margenUSD = totalIngresoUSD - totalEgresoUSD;

  const totalStockInsumos = insumos.length;
  const totalCombustible  = combustible.reduce((s: number, c: any) => s + Number(c.stock_lt ?? 0), 0);

  const fmt = (usd: number) => moneda === 'USD' ? fmtUSD(usd) : fmtARS(usd * tipoCambio);

  const cards = [
    {
      href: '/granos', label: 'Stock de granos', icon: '🌾',
      value: `${fmtNum(totalGranosTn, 1)} tn`,
      sub: `${granosCamp.length} cultivos · campaña ${campana}`,
      color: 'border-grain/40 bg-[#1a1000]', textColor: 'text-grain',
    },
    {
      href: '/insumos', label: 'Stock de insumos', icon: '🧪',
      value: `${totalStockInsumos} productos`,
      sub: 'Agroquímicos, semillas, fertilizantes',
      color: 'border-input/40 bg-[#10101a]', textColor: 'text-input',
    },
    {
      href: '/combustible', label: 'Combustible', icon: '⛽',
      value: `${fmtNum(totalCombustible, 0)} lt`,
      sub: 'Stock disponible',
      color: 'border-fuel/40 bg-[#1a1010]', textColor: 'text-fuel',
    },
    {
      href: '/finanzas', label: 'Margen bruto', icon: '💰',
      value: fmt(margenUSD),
      sub: `Ing: ${fmt(totalIngresoUSD)} · Eg: ${fmt(totalEgresoUSD)}`,
      color: margenUSD >= 0 ? 'border-money/40 bg-[#0a1a12]' : 'border-red-600/40 bg-[#1a0a0a]',
      textColor: margenUSD >= 0 ? 'text-money' : 'text-red-400',
    },
  ];

  return (
    <div>
      <p className="eyebrow mb-1">Resumen</p>
      <h2 className="text-xl font-bold text-hi mb-6">Campaña {campana}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <Link key={c.href} href={c.href}
            className={`card ${c.color} p-5 hover:-translate-y-1 transition-all duration-150 group`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{c.icon}</span>
              <span className="text-lo text-xs group-hover:text-mid transition-colors">→</span>
            </div>
            <p className="text-xs text-mid uppercase tracking-wider mb-1">{c.label}</p>
            <p className={`text-2xl font-black ${c.textColor}`}>{c.value}</p>
            <p className="text-lo text-xs mt-1">{c.sub}</p>
          </Link>
        ))}
      </div>

      {/* Detalle granos por cultivo */}
      {granosCamp.length > 0 && (
        <div className="card p-5 mb-4">
          <p className="eyebrow mb-3">Granos por cultivo — {campana}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {granosCamp.map((g: any) => (
              <div key={g.cultivo} className="bg-base-4 rounded-lg p-3">
                <p className="text-xs text-mid uppercase tracking-wider">{g.cultivo}</p>
                <p className="text-grain font-black text-xl">{fmtNum(g.stock_actual_tn, 1)} tn</p>
                <p className="text-lo text-xs">
                  {fmtNum(g.cosechado_tn, 1)} cosechadas · {fmtNum(g.vendido_tn, 1)} vendidas
                </p>
                {g.ingreso_usd > 0 && <p className="text-money text-xs mt-1">{fmtUSD(g.ingreso_usd)}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {granosCamp.length === 0 && movsCamp.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-3xl mb-3">🌱</p>
          <p className="text-mid mb-2">Todavía no hay datos para la campaña {campana}.</p>
          <p className="text-lo text-sm">Empezá cargando el stock de granos o insumos.</p>
        </div>
      )}
    </div>
  );
}
