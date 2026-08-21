import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: { DEFAULT: '#0a0a0a', 2: '#111', 3: '#131313', 4: '#1a1a1a', 5: '#262626', 6: '#333' },
        ochre: { DEFAULT: '#f59e0b', dark: '#d97706', light: '#fcd34d', tint: 'rgba(245,158,11,0.1)' },
        afa:   { DEFAULT: '#2EAA6E', dark: '#1d7a4d', light: '#4dc88a', tint: 'rgba(46,170,110,0.12)' },
        // Colores por módulo
        grain:  { DEFAULT: '#f59e0b', tint: 'rgba(245,158,11,0.1)' },   // dorado — granos
        input:  { DEFAULT: '#818cf8', tint: 'rgba(129,140,248,0.1)' },  // violeta — insumos
        fuel:   { DEFAULT: '#f87171', tint: 'rgba(248,113,113,0.1)' },  // rojo — combustible
        money:  { DEFAULT: '#34d399', tint: 'rgba(52,211,153,0.1)' },   // verde esmeralda — finanzas
        hi: '#f5f5f5', mid: '#a3a3a3', lo: '#525252',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '12px' },
    },
  },
  plugins: [],
};
export default config;
