import { createClient } from '@/lib/supabase/server';
import { PerfilClient } from './perfil-client';
export default async function PerfilPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await (sb as any).from('productores_perfil').select('*').eq('id', user.id).single();
  return <PerfilClient perfil={data} userId={user.id} />;
}
