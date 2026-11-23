import { Component, ElementRef, signal, viewChild } from '@angular/core';

import { dinero, fecha, tasa } from '../../../modelo/formato';
import { GrupoVenta, Moneda } from '../../../modelo/venta';

/** Cronograma de pagos de la compra en cuotas (Fig. 16): método francés. */
@Component({
  selector: 'app-cronograma-dialogo',
  templateUrl: './cronograma-dialogo.html',
  styleUrl: './cronograma-dialogo.css',
})
export class CronogramaDialogo {
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');
  protected readonly grupo = signal<GrupoVenta | null>(null);
  protected readonly moneda = signal<Moneda>('PEN');
  protected readonly f = { dinero, fecha, tasa };

  abrir(grupo: GrupoVenta, moneda: Moneda): void {
    this.grupo.set(grupo);
    this.moneda.set(moneda);
    this.dialogo().nativeElement.showModal();
  }

  protected cerrar(): void {
    this.dialogo().nativeElement.close();
  }

  protected totalIntereses(g: GrupoVenta): string {
    // Suma de textos con 2 decimales, en céntimos enteros (solo para mostrar).
    const c = g.cronograma.reduce((s, x) => s + Math.round(Number(x.interes) * 100), 0);
    return (c / 100).toFixed(2);
  }
}
