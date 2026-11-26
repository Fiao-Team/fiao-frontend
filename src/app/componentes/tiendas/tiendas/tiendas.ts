import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { Subscription } from 'rxjs';

import { EstadoFiltroTienda, TiendaItem, TiendaResumen } from '../../../modelo/tienda';
import { TiendaService } from '../../../servicios/tienda-service';
import { Ayuda } from '../../compartidos/ayuda/ayuda';
import { ComoUsar } from '../../compartidos/como-usar/como-usar';
import { Icono } from '../../compartidos/icono/icono';
import { TiendaEstadoDialogo } from '../tienda-estado-dialogo/tienda-estado-dialogo';
import { TiendaFormularioDialogo } from '../tienda-formulario-dialogo/tienda-formulario-dialogo';

/**
 * Gestión de tiendas para el Administrador del sistema (Fig. 2 a 5, pseudocódigo 4.3).
 * Muestra KPIs, filtros, listado de tiendas y acciones de alta, edición, baja y reactivación.
 */
@Component({
  selector: 'app-tiendas',
  imports: [Ayuda, ComoUsar, Icono, TiendaFormularioDialogo, TiendaEstadoDialogo],
  templateUrl: './tiendas.html',
  styleUrl: './tiendas.css',
})
export class Tiendas implements OnInit, OnDestroy {
  private readonly servicio = inject(TiendaService);
  private readonly formularioDialogo = viewChild.required(TiendaFormularioDialogo);
  private readonly estadoDialogo = viewChild.required(TiendaEstadoDialogo);

  protected readonly resumen = signal<TiendaResumen>({ total: 0, activas: 0, inactivas: 0 });
  protected readonly giros = signal<string[]>([]);
  protected readonly tiendas = signal<TiendaItem[]>([]);

  protected readonly buscar = signal('');
  protected readonly giro = signal('');
  protected readonly estado = signal<EstadoFiltroTienda>('TODAS');

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  private espera?: ReturnType<typeof setTimeout>;
  private pedido?: Subscription;

  protected readonly pasos = [
    'Revisa las tarjetas superiores para ver el total de tiendas, cuántas están activas y cuántas inactivas.',
    'Usa los filtros para buscar por nombre comercial o RUC, o filtrar por giro y estado.',
    'Presiona "+ Nueva tienda" para registrar un negocio y crear automáticamente el usuario de su dueño.',
    'En la columna Acciones puedes editar los datos de una tienda, darla de baja (bloquea al dueño y sus clientes conservando el historial) o reactivarla.',
  ];

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    clearTimeout(this.espera);
    this.pedido?.unsubscribe();
  }

  protected alBuscar(texto: string): void {
    this.buscar.set(texto);
    clearTimeout(this.espera);
    this.espera = setTimeout(() => this.cargar(), 300);
  }

  protected alCambiarGiro(giro: string): void {
    this.giro.set(giro);
    this.cargar();
  }

  protected alCambiarEstado(estado: string): void {
    this.estado.set(estado as EstadoFiltroTienda);
    this.cargar();
  }

  protected cargar(): void {
    this.pedido?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);

    this.pedido = this.servicio
      .listar({
        buscar: this.buscar(),
        giro: this.giro(),
        estado: this.estado(),
      })
      .subscribe({
        next: (r) => {
          this.resumen.set(r.resumen);
          this.giros.set(r.giros);
          this.tiendas.set(r.tiendas);
          this.cargando.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.cargando.set(false);
          this.error.set(
            e.status === 0
              ? 'No se pudo conectar con el servidor. Intenta de nuevo en un momento.'
              : (e.error?.detail ?? 'No se pudo cargar el listado de tiendas.'),
          );
        },
      });
  }

  protected nuevaTienda(): void {
    this.aviso.set(null);
    this.formularioDialogo().abrirCrear();
  }

  protected editarTienda(t: TiendaItem): void {
    this.aviso.set(null);
    this.formularioDialogo().abrirEditar(t);
  }

  protected confirmarBaja(t: TiendaItem): void {
    this.aviso.set(null);
    this.estadoDialogo().abrirBaja(t);
  }

  protected confirmarReactivar(t: TiendaItem): void {
    this.aviso.set(null);
    this.estadoDialogo().abrirReactivar(t);
  }

  protected alGuardar(tienda: TiendaItem): void {
    this.aviso.set(`Tienda "${tienda.nombre_comercial}" guardada correctamente.`);
    this.cargar();
  }

  protected alCambiarEstadoTienda(tienda: TiendaItem): void {
    const accion = tienda.estado === 1 ? 'reactivada' : 'dada de baja';
    this.aviso.set(`Tienda "${tienda.nombre_comercial}" ${accion} correctamente.`);
    this.cargar();
  }
}
