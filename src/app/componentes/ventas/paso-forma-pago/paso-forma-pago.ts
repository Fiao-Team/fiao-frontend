import { Component, computed, input, output } from '@angular/core';

import { dinero, fecha, fechaHora, tasa } from '../../../modelo/formato';
import {
  ClienteResumen,
  GrupoVenta,
  ItemCarrito,
  MODALIDADES_PERMITIDAS,
  Modalidad,
  VentaResultado,
} from '../../../modelo/venta';
import { Ayuda } from '../../compartidos/ayuda/ayuda';
import { Icono } from '../../compartidos/icono/icono';

/**
 * Nueva venta, paso 3 (Fig. 15, 18 y 19): forma de pago de cada producto,
 * número de cuotas y el cálculo que devuelve el backend (vista previa).
 * Este componente NO calcula intereses: solo muestra la vista previa.
 */
@Component({
  selector: 'app-paso-forma-pago',
  imports: [Ayuda, Icono],
  templateUrl: './paso-forma-pago.html',
  styleUrl: './paso-forma-pago.css',
})
export class PasoFormaPago {
  readonly cliente = input.required<ClienteResumen>();
  readonly carrito = input.required<ItemCarrito[]>();
  readonly cuotas = input.required<number>();
  readonly previa = input<VentaResultado | null>(null);
  readonly cargando = input(false);
  readonly error = input<string | null>(null);

  readonly modalidadCambio = output<{ indice: number; modalidad: Modalidad }>();
  readonly cuotasCambio = output<number>();
  readonly verCronograma = output<GrupoVenta>();

  protected readonly f = { dinero, fecha, fechaHora, tasa };
  protected readonly permitidas = MODALIDADES_PERMITIDAS;

  protected readonly hayEnMeses = computed(() => this.carrito().some((i) => i.modalidad === 'EN_MESES'));
  protected readonly opcionesCuotas = computed(() =>
    Array.from({ length: this.cliente().plazo_max_meses }, (_, i) => i + 1),
  );

  protected nombreModalidad(m: Modalidad): string {
    return m === 'FIN_DE_MES' ? 'Fin de mes' : 'En cuotas';
  }
}
