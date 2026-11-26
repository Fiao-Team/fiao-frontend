// Tipos del Dashboard Inicio del Dueño de Negocio (Fig. 6). Igual que app/dto/negocio.py.

import { Moneda } from './venta';

export type SituacionVencimiento = 'EN_MORA' | 'CON_DEUDA';

/** Fila de la tarjeta 'Próximos vencimientos' en el inicio del negocio. */
export interface ProximoVencimiento {
  cliente_id: number;
  nombres_apellidos: string;
  moneda: Moneda;
  monto: string;
  fecha_pago: string;
  situacion: SituacionVencimiento;
  dias_mora: number;
}

/** Fila de la tarjeta lateral 'Clientes en mora'. */
export interface ClienteEnMora {
  cliente_id: number;
  nombres_apellidos: string;
  moneda: Moneda;
  dias_atraso: number;
  monto_vencido: string;
}

/** Respuesta completa de GET /negocio/inicio (Fig. 6). */
export interface InicioNegocio {
  tienda_id: number;
  nombre_comercial: string;
  clientes_activos: number;

  total_por_cobrar_pen: string;
  total_por_cobrar_usd: string;

  clientes_en_mora_count: number;

  vencen_esta_semana_count: number;
  vencen_esta_semana_pen: string;
  vencen_esta_semana_usd: string;

  credito_este_mes_pen: string;
  credito_este_mes_usd: string;
  ventas_este_mes_count: number;

  proximos_vencimientos: ProximoVencimiento[];
  clientes_en_mora: ClienteEnMora[];
}
