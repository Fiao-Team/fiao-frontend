// Tipos del catálogo de productos (Fig. 7 y 8). Igual que app/dto/productos.py.

import { FormaVenta, Moneda } from './venta';

/** Fila del catálogo de productos en la bandeja del negocio (Fig. 7). */
export interface ProductoItem {
  producto_id: number;
  nombre: string;
  marca: string | null;
  categoria: string | null;
  proveedor: string | null;
  unidad_medida: string;
  moneda: Moneda;
  precio_contado: string;
  precio_lista: string;
  forma_venta_credito: FormaVenta;
  imagen_url: string | null;
  estado: number;
}

/** Datos para registrar o editar un producto (Fig. 8). */
export interface ProductoEntrada {
  nombre: string;
  descripcion?: string | null;
  marca?: string | null;
  categoria?: string | null;
  proveedor?: string | null;
  unidad_medida: string;
  moneda: Moneda;
  precio_contado: string;
  precio_lista: string;
  forma_venta_credito: FormaVenta;
  imagen_url?: string | null;
}

/** Etiquetas legibles para las modalidades de venta a crédito. */
export const ETIQUETA_FORMA_VENTA: Record<FormaVenta, string> = {
  FIN_DE_MES: 'Fin de mes',
  EN_MESES: 'En cuotas',
  AMBAS: 'Fin de mes y cuotas',
};

/** Unidades de medida comunes en bodegas y negocios de barrio. */
export const UNIDADES_MEDIDA = [
  'Unidad',
  'Bolsa',
  'Botella',
  'Caja',
  'Kg',
  'Lata',
  'Litro',
  'Molde',
  'Paquete',
  'Saco',
] as const;
