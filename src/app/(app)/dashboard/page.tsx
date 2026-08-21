import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const uid = user.id;

  const [granos, insumos, combustible, movimientos, perfil] = await Promise.all([
    (sb as any).from('vw_stock_granos').select('*').eq('productor_id', uid),
    (sb as any).from('vw_stock_insumos').select('*').eq('productor_id', uid),
    (sb as any).from('vw_stock_combustible').select('*').eq('productor_id', uid),
    (sb as any).from('vw_margen_bruto').select('*').eq('productor_id', uid),
    (sb as any).from('productores_perfil').select('tipo_cambio,moneda_pref').eq('id', uid).single(),
  ]);

  return (
    <DashboardClient
      granos={granos.data ?? []}
      insumos={insumos.data ?? []}
      combustible={combustible.data ?? []}
      movimientos={movimientos.data ?? []}
      tipoCambio={perfil.data?.tipo_cambio ?? 1000}
    />
  );
}
