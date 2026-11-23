// Formato para mostrar montos, tasas y fechas. NO calcula nada financiero:
// los números ya vienen calculados por el backend.

import { Moneda } from './venta';

const SIMBOLO: Record<Moneda, string> = { PEN: 'S/', USD: 'US$' };

/** "45.36" -> "S/ 45.36" (con separador de miles). */
export function dinero(moneda: Moneda, monto: string | null | undefined): string {
  if (monto == null) return '—';
  const [entero, decimales = '00'] = monto.split('.');
  const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${SIMBOLO[moneda]} ${conMiles}.${decimales.padEnd(2, '0').slice(0, 2)}`;
}

/** "30.0000000" -> "30.0000000 %" (las tasas se muestran con 7 decimales). */
export function tasa(valor: string | null | undefined): string {
  return valor == null ? '—' : `${valor} %`;
}

/** "2026-09-26" o "2026-09-20T23:59:00" -> "26/09/2026" */
export function fecha(valor: string | null | undefined): string {
  if (!valor) return '—';
  const [a, m, d] = valor.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

/** "2026-09-20T23:59:00" -> "20/09/2026 23:59" */
export function fechaHora(valor: string | null | undefined): string {
  return valor ? `${fecha(valor)} ${valor.slice(11, 16)}` : '—';
}
