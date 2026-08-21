import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function fmtNum(n: number, decimals = 2) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}
export function fmtUSD(n: number) { return `U$S ${fmtNum(n)}`; }
export function fmtARS(n: number) { return `$ ${fmtNum(n, 0)}`; }
export function getCampanaActual(): string {
  const hoy = new Date();
  const mes = hoy.getMonth() + 1; const dia = hoy.getDate(); const anio = hoy.getFullYear();
  const inicio = mes > 5 || (mes === 5 && dia >= 20);
  const anioInicio = inicio ? anio : anio - 1;
  return `${anioInicio}/${anioInicio + 1}`;
}
