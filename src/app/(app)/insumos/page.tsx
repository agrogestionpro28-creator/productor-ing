import { createClient } from '@/lib/supabase/server';
import { InsumosClient } from './insumos-client';
export default async function InsumosPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await (sb as any).from('stock_insumos').select('*').eq('productor_id', user.id).order('fecha', { ascending: false });
  const { data: resumen } = await (sb as any).from('vw_stock_insumos').select('*').eq('productor_id', user.id);
  return <InsumosClient data={data ?? []} resumen={resumen ?? []} userId={user.id} />;
}
