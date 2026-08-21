import { createClient } from '@/lib/supabase/server';
import { FinanzasClient } from './finanzas-client';

export default async function FinanzasPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const [movs, margen] = await Promise.all([
    (sb as any).from('movimientos').select('*').eq('productor_id', user.id).order('fecha', { ascending: false }),
    (sb as any).from('vw_margen_bruto').select('*').eq('productor_id', user.id),
  ]);
  return <FinanzasClient movimientos={movs.data ?? []} margen={margen.data ?? []} userId={user.id} />;
}
