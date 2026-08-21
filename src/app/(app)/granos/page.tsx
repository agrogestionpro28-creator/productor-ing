import { createClient } from '@/lib/supabase/server';
import { GranosClient } from './granos-client';
export default async function GranosPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await (sb as any).from('stock_granos').select('*').eq('productor_id', user.id).order('fecha', { ascending: false });
  const { data: resumen } = await (sb as any).from('vw_stock_granos').select('*').eq('productor_id', user.id);
  return <GranosClient data={data ?? []} resumen={resumen ?? []} userId={user.id} />;
}
