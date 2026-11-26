import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';

import { TiendaItem } from '../../../modelo/tienda';
import { TiendaService } from '../../../servicios/tienda-service';
import { Icono } from '../../compartidos/icono/icono';

type AccionEstado = 'baja' | 'activar';

/** Modal de confirmación para dar de baja o reactivar una tienda (Fig. 5). */
@Component({
  selector: 'app-tienda-estado-dialogo',
  imports: [Icono],
  templateUrl: './tienda-estado-dialogo.html',
  styleUrl: './tienda-estado-dialogo.css',
})
export class TiendaEstadoDialogo {
  private readonly tiendas = inject(TiendaService);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  readonly actualizado = output<TiendaItem>();

  protected readonly tienda = signal<TiendaItem | null>(null);
  protected readonly accion = signal<AccionEstado>('baja');
  protected readonly procesando = signal(false);
  protected readonly error = signal<string | null>(null);

  abrirBaja(tienda: TiendaItem): void {
    this.tienda.set(tienda);
    this.accion.set('baja');
    this.error.set(null);
    this.dialogo().nativeElement.showModal();
  }

  abrirReactivar(tienda: TiendaItem): void {
    this.tienda.set(tienda);
    this.accion.set('activar');
    this.error.set(null);
    this.dialogo().nativeElement.showModal();
  }

  protected cerrar(): void {
    this.dialogo().nativeElement.close();
  }

  protected confirmar(): void {
    const t = this.tienda();
    if (!t || this.procesando()) return;

    this.procesando.set(true);
    this.error.set(null);
    const peticion =
      this.accion() === 'baja' ? this.tiendas.darDeBaja(t.tienda_id) : this.tiendas.reactivar(t.tienda_id);

    peticion.subscribe({
      next: (res) => {
        this.procesando.set(false);
        this.cerrar();
        this.actualizado.emit(res);
      },
      error: (e: HttpErrorResponse) => {
        this.procesando.set(false);
        this.error.set(e.error?.detail ?? 'No se pudo actualizar el estado de la tienda.');
      },
    });
  }
}
