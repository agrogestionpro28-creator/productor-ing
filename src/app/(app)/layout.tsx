import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await (sb as any).from('productores_perfil')
    .select('nombre,apellido,razon_social,tipo_cambio,moneda_pref').eq('id', user.id).single();

  if (!perfil) redirect('/login');

  return <AppShell perfil={perfil}>{children}</AppShell>;
}
