// Tipos de ventas (Fig. 13 a 19). Igual que los DTO del backend (app/dto/ventas.py).
// Los montos y tasas llegan como TEXTO ("45.36", "30.0000000") para no perder exactitud.

export type Moneda = 'PEN' | 'USD';
export type Modalidad = 'FIN_DE_MES' | 'EN_MESES';
export type FormaVenta = 'FIN_DE_MES' | 'EN_MESES' | 'AMBAS';

/** Paso 1: resultado de la búsqueda de clientes. */
export interface ClienteBusqueda {
  cliente_id: number;
  nombres_apellidos: string;
  dni: string;
  moneda: Moneda;
}

/** Paso 1: resumen del cliente elegido. */
export interface ClienteResumen extends ClienteBusqueda {
  limite_credito: string;
  saldo_deudor: string;
  disponible: string;
  plazo_max_meses: number;
  dia_corte: number;
  hora_corte: string;
  dia_pago: number;
  fecha_corte: string;
  fecha_pago: string;
  posterior_al_corte: boolean;
}

/** Paso 2: producto que se puede vender al cliente. */
export interface ProductoVenta {
  producto_id: number;
  nombre: string;
  marca: string | null;
  unidad_medida: string;
  moneda: Moneda;
  precio_lista: string;
  forma_venta_credito: FormaVenta;
  imagen_url: string | null;
}

/** Un producto en el carrito (vive solo en el navegador). */
export interface ItemCarrito {
  producto: ProductoVenta;
  cantidad: number;
  modalidad: Modalidad;
}

/** Lo que se envía a /ventas/vista-previa y /ventas. */
export interface VentaEntrada {
  cliente_id: number;
  items: { producto_id: number; cantidad: string; modalidad: Modalidad }[];
  cuotas: number | null;
}

export interface LineaVenta {
  producto_id: number;
  nombre: string;
  cantidad: string;
  precio_unitario: string;
  subtotal: string;
}

export interface CuotaVista {
  numero: number;
  vencimiento: string;
  saldo_inicial: string;
  interes: string;
  amortizacion: string;
  cuota: string;
  saldo_final: string;
}

/** Una compra: los productos de una misma modalidad. */
export interface GrupoVenta {
  modalidad: Modalidad;
  transaccion_id: number | null;
  lineas: LineaVenta[];
  C: string;
  dias: number;
  tep: string;
  interes: string;
  total: string;
  tcea: string;
  cuotas: number | null;
  C_prima: string | null;
  tem: string | null;
  frc: string | null;
  R: string | null;
  cronograma: CuotaVista[];
}

/** Resultado de la vista previa o de la venta registrada. */
export interface VentaResultado {
  cliente_id: number;
  moneda: Moneda;
  fecha_compra: string;
  fecha_corte: string;
  fecha_pago: string;
  posterior_al_corte: boolean;
  aviso: string | null;
  tea: string;
  total_capital: string;
  total_a_pagar: string;
  disponible: string;
  disponible_despues: string;
  aprobado: boolean;
  mensaje_limite: string | null;
  grupos: GrupoVenta[];
}

/** Qué modalidades permite cada forma de venta del producto. */
export const MODALIDADES_PERMITIDAS: Record<FormaVenta, Modalidad[]> = {
  FIN_DE_MES: ['FIN_DE_MES'],
  EN_MESES: ['EN_MESES'],
  AMBAS: ['FIN_DE_MES', 'EN_MESES'],
};
