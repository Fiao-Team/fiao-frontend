import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, computed, inject, output, signal, viewChild } from '@angular/core';

import { ClienteItem } from '../../../modelo/cliente';
import { dinero } from '../../../modelo/formato';
import { ClienteService } from '../../../servicios/cliente-service';
import { Icono } from '../../compartidos/icono/icono';

type AccionEstado = 'baja' | 'activar';

/** Modal de confirmación para dar de baja o reactivar un cliente (Fig. 12). */
@Component({
  selector: 'app-cliente-estado-dialogo',
  imports: [Icono],
  templateUrl: './cliente-estado-dialogo.html',
  styleUrl: './cliente-estado-dialogo.css',
})
export class ClienteEstadoDialogo {
  private readonly clientes = inject(ClienteService);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  readonly actualizado = output<ClienteItem>();

  protected readonly cliente = signal<ClienteItem | null>(null);
  protected readonly accion = signal<AccionEstado>('baja');
  protected readonly procesando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly dinero = dinero;

  protected readonly tieneDeuda = computed(() => {
    const c = this.cliente();
    return c !== null && Number(c.saldo_deudor) > 0;
  });

  abrirBaja(cliente: ClienteItem): void {
    this.cliente.set(cliente);
    this.accion.set('baja');
    this.error.set(null);
    this.dialogo().nativeElement.showModal();
  }

  abrirReactivar(cliente: ClienteItem): void {
    this.cliente.set(cliente);
    this.accion.set('activar');
    this.error.set(null);
    this.dialogo().nativeElement.showModal();
  }

  protected cerrar(): void {
    this.dialogo().nativeElement.close();
  }

  protected confirmar(): void {
    const c = this.cliente();
    if (!c || this.procesando()) return;

    this.procesando.set(true);
    this.error.set(null);
    const peticion =
      this.accion() === 'baja'
        ? this.clientes.darDeBaja(c.cliente_id)
        : this.clientes.reactivar(c.cliente_id);

    peticion.subscribe({
      next: (res) => {
        this.procesando.set(false);
        this.cerrar();
        this.actualizado.emit(res);
      },
      error: (e: HttpErrorResponse) => {
        this.procesando.set(false);
        this.error.set(e.error?.detail ?? 'No se pudo actualizar el estado del cliente.');
      },
    });
  }
}
