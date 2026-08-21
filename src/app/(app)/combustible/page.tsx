import { createClient } from '@/lib/supabase/server';
import { CombustibleClient } from './combustible-client';
export default async function CombustiblePage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await (sb as any).from('stock_combustible').select('*').eq('productor_id', user.id).order('fecha', { ascending: false });
  const { data: resumen } = await (sb as any).from('vw_stock_combustible').select('*').eq('productor_id', user.id);
  return <CombustibleClient data={data ?? []} resumen={resumen ?? []} userId={user.id} />;
}
