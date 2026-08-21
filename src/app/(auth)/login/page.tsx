import { login, signup } from './actions';
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; mode?: string }> }) {
  const p = await searchParams;
  const isSignup = p.mode === 'signup';
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{background:'linear-gradient(135deg,#0a1a0a 0%,#0a0a0a 60%)'}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-base-3 border-2 border-ochre rounded-2xl mb-4">
            <span className="text-ochre font-black text-2xl">MC</span>
          </div>
          <h1 className="text-2xl font-bold text-hi">Mi Campo</h1>
          <p className="text-mid text-sm mt-1">Dashboard del productor</p>
        </div>
        <form className="card p-6 space-y-4">
          {isSignup && (
            <div>
              <label className="block text-xs font-semibold text-mid mb-1.5 uppercase tracking-wider">Nombre completo</label>
              <input name="nombre" type="text" required className="field" placeholder="Juan Pérez" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-mid mb-1.5 uppercase tracking-wider">Email</label>
            <input name="email" type="email" required className="field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-mid mb-1.5 uppercase tracking-wider">Contraseña</label>
            <input name="password" type="password" required minLength={6} className="field" />
          </div>
          {p.error && <p className="text-xs text-red-400 bg-red-950 border border-red-800 rounded px-3 py-2">{decodeURIComponent(p.error)}</p>}
          <button formAction={isSignup ? signup : login} className="btn-primary w-full">
            {isSignup ? 'Crear cuenta' : 'Ingresar'}
          </button>
        </form>
        <p className="text-center text-sm text-lo mt-5">
          {isSignup
            ? <><a href="/login" className="text-ochre hover:underline">Ya tengo cuenta</a></>
            : <><a href="/login?mode=signup" className="text-ochre hover:underline">Crear cuenta nueva</a></>}
        </p>
      </div>
    </main>
  );
}
