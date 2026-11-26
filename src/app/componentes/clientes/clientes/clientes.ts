import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { Subscription } from 'rxjs';

import { ClienteItem } from '../../../modelo/cliente';
import { dinero, tasa } from '../../../modelo/formato';
import { Moneda } from '../../../modelo/venta';
import { ClienteService } from '../../../servicios/cliente-service';
import { Ayuda } from '../../compartidos/ayuda/ayuda';
import { ComoUsar } from '../../compartidos/como-usar/como-usar';
import { Icono } from '../../compartidos/icono/icono';
import { ClienteEstadoDialogo } from '../cliente-estado-dialogo/cliente-estado-dialogo';
import { ClienteFormularioDialogo } from '../cliente-formulario-dialogo/cliente-formulario-dialogo';

/**
 * Gestión de Clientes y Límites de Crédito para ADMIN_NEGOCIO (Fig. 9 a 12).
 * Muestra límite, saldo deudor, disponible, ciclo de corte/pago y TEA normalizadas.
 */
@Component({
  selector: 'app-clientes',
  imports: [Ayuda, ComoUsar, Icono, ClienteFormularioDialogo, ClienteEstadoDialogo],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes implements OnInit, OnDestroy {
  private readonly servicio = inject(ClienteService);
  private readonly formularioDialogo = viewChild.required(ClienteFormularioDialogo);
  private readonly estadoDialogo = viewChild.required(ClienteEstadoDialogo);

  protected readonly clientes = signal<ClienteItem[]>([]);
  protected readonly buscar = signal('');
  protected readonly moneda = signal<Moneda | ''>('');
  protected readonly mostrarInactivos = signal(false);

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  protected readonly dinero = dinero;
  protected readonly tasa = tasa;

  private espera?: ReturnType<typeof setTimeout>;
  private pedido?: Subscription;

  protected readonly pasos = [
    'Busca clientes por nombre, DNI o teléfono, y filtra por moneda (soles o dólares).',
    'Presiona "+ Nuevo cliente" para registrar un cliente con su límite de crédito, ciclo de corte/pago y tasas validadas contra los topes del BCRP.',
    'En cada fila verás el límite asignado, el saldo usado (capital pendiente) y el crédito disponible.',
    'Solo puedes dar de baja a un cliente cuando su saldo deudor sea 0.00. Activa "Mostrar clientes inactivos" si deseas reactivarlo.',
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

  protected alCambiarMoneda(valor: string): void {
    this.moneda.set(valor as Moneda | '');
    this.cargar();
  }

  protected alAlternarInactivos(mostrar: boolean): void {
    this.mostrarInactivos.set(mostrar);
    this.cargar();
  }

  protected cargar(): void {
    this.pedido?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);

    this.pedido = this.servicio
      .listar({
        buscar: this.buscar(),
        moneda: this.moneda(),
        solo_activos: !this.mostrarInactivos(),
      })
      .subscribe({
        next: (lista) => {
          this.clientes.set(lista);
          this.cargando.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.cargando.set(false);
          this.error.set(
            e.status === 0
              ? 'No se pudo conectar con el servidor. Intenta de nuevo en un momento.'
              : (e.error?.detail ?? 'No se pudo cargar el listado de clientes.'),
          );
        },
      });
  }

  protected nuevoCliente(): void {
    this.aviso.set(null);
    this.formularioDialogo().abrirCrear();
  }

  protected editarCliente(c: ClienteItem): void {
    this.aviso.set(null);
    this.formularioDialogo().abrirEditar(c);
  }

  protected confirmarBaja(c: ClienteItem): void {
    this.aviso.set(null);
    this.estadoDialogo().abrirBaja(c);
  }

  protected confirmarReactivar(c: ClienteItem): void {
    this.aviso.set(null);
    this.estadoDialogo().abrirReactivar(c);
  }

  protected alGuardar(cliente: ClienteItem): void {
    this.aviso.set(`Cliente "${cliente.nombres_apellidos}" guardado correctamente.`);
    this.cargar();
  }

  protected alCambiarEstado(cliente: ClienteItem): void {
    const accion = cliente.estado === 1 ? 'reactivado' : 'dado de baja';
    this.aviso.set(`Cliente "${cliente.nombres_apellidos}" ${accion} correctamente.`);
    this.cargar();
  }

  protected monto(moneda: Moneda, valor: string | number): string {
    return this.dinero(moneda, String(valor));
  }
}
