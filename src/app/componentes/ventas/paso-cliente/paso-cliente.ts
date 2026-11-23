import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, input, output, signal } from '@angular/core';

import { dinero, fecha, fechaHora } from '../../../modelo/formato';
import { ClienteBusqueda, ClienteResumen } from '../../../modelo/venta';
import { VentaService } from '../../../servicios/venta-service';
import { Ayuda } from '../../compartidos/ayuda/ayuda';
import { Icono } from '../../compartidos/icono/icono';

/** Nueva venta, paso 1 (Fig. 13): elegir al cliente. */
@Component({
  selector: 'app-paso-cliente',
  imports: [Ayuda, Icono],
  templateUrl: './paso-cliente.html',
  styleUrl: './paso-cliente.css',
})
export class PasoCliente implements OnInit {
  private readonly ventas = inject(VentaService);

  /** Cliente ya elegido (si se vuelve a este paso). */
  readonly cliente = input<ClienteResumen | null>(null);
  readonly elegido = output<ClienteResumen>();

  protected readonly resultados = signal<ClienteBusqueda[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly formato = { dinero, fecha, fechaHora };
  private espera?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.buscar('');
  }

  /** Busca mientras se escribe, esperando 300 ms para no consultar por cada letra. */
  protected alEscribir(texto: string): void {
    clearTimeout(this.espera);
    this.espera = setTimeout(() => this.buscar(texto), 300);
  }

  private buscar(texto: string): void {
    this.ventas.buscarClientes(texto).subscribe({
      next: (r) => this.resultados.set(r),
      error: (e: HttpErrorResponse) => this.error.set(e.error?.detail ?? 'No se pudo buscar clientes'),
    });
  }

  protected elegir(c: ClienteBusqueda): void {
    this.error.set(null);
    this.ventas.resumenCliente(c.cliente_id).subscribe({
      next: (resumen) => this.elegido.emit(resumen),
      error: (e: HttpErrorResponse) => this.error.set(e.error?.detail ?? 'No se pudo cargar el cliente'),
    });
  }
}
