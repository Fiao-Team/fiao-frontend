import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';

import { ProductoItem } from '../../../modelo/producto';
import { ProductoService } from '../../../servicios/producto-service';
import { Icono } from '../../compartidos/icono/icono';

type AccionEstado = 'baja' | 'activar';

/** Modal de confirmación para dar de baja lógica o reactivar un producto. */
@Component({
  selector: 'app-producto-estado-dialogo',
  imports: [Icono],
  templateUrl: './producto-estado-dialogo.html',
  styleUrl: './producto-estado-dialogo.css',
})
export class ProductoEstadoDialogo {
  private readonly productos = inject(ProductoService);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  readonly actualizado = output<ProductoItem>();

  protected readonly producto = signal<ProductoItem | null>(null);
  protected readonly accion = signal<AccionEstado>('baja');
  protected readonly procesando = signal(false);
  protected readonly error = signal<string | null>(null);

  abrirBaja(producto: ProductoItem): void {
    this.producto.set(producto);
    this.accion.set('baja');
    this.error.set(null);
    this.dialogo().nativeElement.showModal();
  }

  abrirReactivar(producto: ProductoItem): void {
    this.producto.set(producto);
    this.accion.set('activar');
    this.error.set(null);
    this.dialogo().nativeElement.showModal();
  }

  protected cerrar(): void {
    this.dialogo().nativeElement.close();
  }

  protected confirmar(): void {
    const p = this.producto();
    if (!p || this.procesando()) return;

    this.procesando.set(true);
    this.error.set(null);
    const peticion =
      this.accion() === 'baja'
        ? this.productos.darDeBaja(p.producto_id)
        : this.productos.reactivar(p.producto_id);

    peticion.subscribe({
      next: (res) => {
        this.procesando.set(false);
        this.cerrar();
        this.actualizado.emit(res);
      },
      error: (e: HttpErrorResponse) => {
        this.procesando.set(false);
        this.error.set(e.error?.detail ?? 'No se pudo actualizar el estado del producto.');
      },
    });
  }
}
