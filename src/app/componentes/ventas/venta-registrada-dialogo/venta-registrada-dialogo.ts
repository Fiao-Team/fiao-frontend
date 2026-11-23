import { Component, ElementRef, output, signal, viewChild } from '@angular/core';

import { dinero, fecha, tasa } from '../../../modelo/formato';
import { VentaResultado } from '../../../modelo/venta';
import { Icono } from '../../compartidos/icono/icono';

/** Confirmación de venta registrada (Fig. 17): las compras generadas y el disponible restante. */
@Component({
  selector: 'app-venta-registrada-dialogo',
  imports: [Icono],
  templateUrl: './venta-registrada-dialogo.html',
  styleUrl: './venta-registrada-dialogo.css',
})
export class VentaRegistradaDialogo {
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');
  protected readonly venta = signal<VentaResultado | null>(null);
  protected readonly f = { dinero, fecha, tasa };

  readonly nuevaVenta = output<void>();
  readonly salir = output<void>();

  abrir(venta: VentaResultado): void {
    this.venta.set(venta);
    this.dialogo().nativeElement.showModal();
  }

  protected elegir(accion: 'nueva' | 'salir'): void {
    this.dialogo().nativeElement.close();
    if (accion === 'nueva') this.nuevaVenta.emit();
    else this.salir.emit();
  }

  protected productos(nombres: { nombre: string }[]): string {
    return nombres.map((l) => l.nombre).join(', ');
  }
}
