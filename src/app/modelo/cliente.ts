// Tipos de Gestión de Clientes y Límites de Crédito (Fig. 9 a 12).
// Igual que app/dto/clientes.py y app/entidades/enums.py.

import { Moneda } from './venta';

export type TipoTasa = 'NOMINAL' | 'EFECTIVA';

export type PeriodoDias =
  | 'DIARIO'
  | 'QUINCENAL'
  | 'MENSUAL'
  | 'BIMESTRAL'
  | 'TRIMESTRAL'
  | 'CUATRIMESTRAL'
  | 'SEMESTRAL'
  | 'ANUAL';

export type CapitalizacionDias =
  | 'DIARIA'
  | 'QUINCENAL'
  | 'MENSUAL'
  | 'BIMESTRAL'
  | 'TRIMESTRAL'
  | 'CUATRIMESTRAL'
  | 'SEMESTRAL'
  | 'ANUAL';

export const PERIODOS_TASA: { valor: PeriodoDias; etiqueta: string }[] = [
  { valor: 'DIARIO', etiqueta: 'Diario' },
  { valor: 'QUINCENAL', etiqueta: 'Quincenal' },
  { valor: 'MENSUAL', etiqueta: 'Mensual' },
  { valor: 'BIMESTRAL', etiqueta: 'Bimestral' },
  { valor: 'TRIMESTRAL', etiqueta: 'Trimestral' },
  { valor: 'CUATRIMESTRAL', etiqueta: 'Cuatrimestral' },
  { valor: 'SEMESTRAL', etiqueta: 'Semestral' },
  { valor: 'ANUAL', etiqueta: 'Anual' },
];

export const CAPITALIZACIONES_TASA: { valor: CapitalizacionDias; etiqueta: string }[] = [
  { valor: 'DIARIA', etiqueta: 'Diaria' },
  { valor: 'QUINCENAL', etiqueta: 'Quincenal' },
  { valor: 'MENSUAL', etiqueta: 'Mensual' },
  { valor: 'BIMESTRAL', etiqueta: 'Bimestral' },
  { valor: 'TRIMESTRAL', etiqueta: 'Trimestral' },
  { valor: 'CUATRIMESTRAL', etiqueta: 'Cuatrimestral' },
  { valor: 'SEMESTRAL', etiqueta: 'Semestral' },
  { valor: 'ANUAL', etiqueta: 'Anual' },
];

/** Fila de la lista de clientes de la tienda (Fig. 9) y vista detalle. */
export interface ClienteItem {
  cliente_id: number;
  dni: string;
  nombres_apellidos: string;
  telefono: string;
  direccion: string;
  username: string | null;
  email: string | null;

  moneda: Moneda;
  limite_credito: string;
  saldo_deudor: string;
  disponible: string;
  plazo_max_meses: number;

  dia_corte: number;
  hora_corte: string;
  dia_pago: number;

  tipo_tasa_comp: TipoTasa;
  tasa_compensatoria: string;
  periodo_tasa_comp: PeriodoDias;
  capitalizacion_comp: CapitalizacionDias | null;
  tea_comp_porcentaje: string;

  tipo_tasa_mora: TipoTasa;
  tasa_moratoria: string;
  periodo_tasa_mora: PeriodoDias;
  capitalizacion_mora: CapitalizacionDias | null;
  tea_mora_porcentaje: string;

  estado: number;
}

/** Datos para previsualizar las TEA calculadas y contrastarlas con topes BCRP. */
export interface VistaPreviaTasasEntrada {
  moneda: Moneda;
  tipo_tasa_comp: TipoTasa;
  tasa_compensatoria: string;
  periodo_tasa_comp: PeriodoDias;
  capitalizacion_comp: CapitalizacionDias | null;
  tipo_tasa_mora: TipoTasa;
  tasa_moratoria: string;
  periodo_tasa_mora: PeriodoDias;
  capitalizacion_mora: CapitalizacionDias | null;
}

/** Resultado de POST /clientes/vista-previa-tasas. */
export interface VistaPreviaTasasRespuesta {
  moneda: Moneda;
  tea_comp_porcentaje: string;
  tea_mora_porcentaje: string;
  tasa_max_comp_bcrp: string;
  tasa_max_mora_bcrp: string;
  cumple_bcrp: boolean;
}

/** Datos para editar un cliente y sus condiciones de crédito. */
export interface ClienteActualizarEntrada {
  dni: string;
  nombres_apellidos: string;
  telefono: string;
  direccion: string;
  moneda: Moneda;
  limite_credito: string;
  plazo_max_meses: number;
  dia_corte: number;
  hora_corte: string;
  dia_pago: number;
  tipo_tasa_comp: TipoTasa;
  tasa_compensatoria: string;
  periodo_tasa_comp: PeriodoDias;
  capitalizacion_comp: CapitalizacionDias | null;
  tipo_tasa_mora: TipoTasa;
  tasa_moratoria: string;
  periodo_tasa_mora: PeriodoDias;
  capitalizacion_mora: CapitalizacionDias | null;
}

/** Datos para registrar un cliente y crear su usuario CLIENTE (Fig. 10 y 11). */
export interface ClienteCrearEntrada extends ClienteActualizarEntrada {
  username: string;
  password: string;
  email?: string | null;
}
