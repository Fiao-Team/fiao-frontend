// Tipos de tiendas (Fig. 2 a 5). Igual que los DTO del backend (app/dto/tiendas.py).

import { Moneda } from './venta';

export type EstadoFiltroTienda = 'TODAS' | 'ACTIVA' | 'INACTIVA';

/** Una tienda en el listado o detalle (Fig. 2). */
export interface TiendaItem {
  tienda_id: number;
  nombre_comercial: string;
  razon_social: string | null;
  ruc: string | null;
  giro: string | null;
  direccion: string | null;
  distrito: string | null;
  telefono: string | null;
  dueno_dni: string | null;
  dueno_nombres: string;
  dueno_email: string | null;
  dueno_username: string;
  moneda_defecto: Moneda;
  logo_url: string | null;
  estado: number;
  clientes_count: number;
}

/** Tarjetas KPI superiores de la pantalla de tiendas (Fig. 2). */
export interface TiendaResumen {
  total: number;
  activas: number;
  inactivas: number;
}

/** Respuesta completa de GET /tiendas (Fig. 2). */
export interface TiendaListadoSalida {
  resumen: TiendaResumen;
  giros: string[];
  tiendas: TiendaItem[];
}

/** Datos para registrar una nueva tienda y su dueño (Fig. 3 y 4). */
export interface TiendaCrearEntrada {
  nombre_comercial: string;
  ruc: string;
  direccion: string;
  distrito: string;
  telefono: string;
  giro: string;
  dueno_nombres: string;
  dueno_dni: string;
  dueno_email: string;
  username: string;
  password: string;
  razon_social?: string | null;
  moneda_defecto?: Moneda;
  logo_url?: string | null;
}

/** Datos para editar una tienda y su dueño (Fig. 2). */
export type TiendaActualizarEntrada = Omit<TiendaCrearEntrada, 'username' | 'password'>;

/** Giros sugeridos en el formulario de registro (Fig. 2 y 3). */
export const GIROS_TIENDA = [
  'Bodega',
  'Panadería',
  'Pollería',
  'Peluquería',
  'Minimarket',
  'Ferretería',
  'Farmacia',
  'Librería',
  'Otro',
] as const;
