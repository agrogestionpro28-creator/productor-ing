'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const sb = await createClient();
  const { error } = await sb.auth.signInWithPassword({
    email: String(formData.get('email')),
    password: String(formData.get('password')),
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const sb = await createClient();
  const nombre = String(formData.get('nombre') ?? '');
  const { data, error } = await sb.auth.signUp({
    email: String(formData.get('email')),
    password: String(formData.get('password')),
    options: { data: { nombre } },
  });
  if (error) redirect(`/login?mode=signup&error=${encodeURIComponent(error.message)}`);
  // Crear perfil manualmente (el trigger es para ingenieros)
  if (data.user) {
    const sbAdmin = await createClient();
    await (sbAdmin as any).from('productores_perfil').upsert({
      id: data.user.id, nombre, email: String(formData.get('email')),
    });
  }
  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function logout() {
  const sb = await createClient();
  await sb.auth.signOut();
  redirect('/login');
}
