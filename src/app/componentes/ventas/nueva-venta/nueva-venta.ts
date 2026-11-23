import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  ClienteResumen,
  GrupoVenta,
  ItemCarrito,
  MODALIDADES_PERMITIDAS,
  Modalidad,
  ProductoVenta,
  VentaEntrada,
  VentaResultado,
} from '../../../modelo/venta';
import { VentaService } from '../../../servicios/venta-service';
import { ComoUsar } from '../../compartidos/como-usar/como-usar';
import { CronogramaDialogo } from '../cronograma-dialogo/cronograma-dialogo';
import { PasoCliente } from '../paso-cliente/paso-cliente';
import { PasoFormaPago } from '../paso-forma-pago/paso-forma-pago';
import { PasoProductos } from '../paso-productos/paso-productos';
import { VentaRegistradaDialogo } from '../venta-registrada-dialogo/venta-registrada-dialogo';

type Paso = 1 | 2 | 3;

/**
 * Nueva venta en 3 pasos (Fig. 13 a 19, pseudocódigo 4.5).
 * Guarda el estado (cliente, carrito, cuotas) y pide al backend la vista previa
 * y el registro. Todos los cálculos financieros los hace el backend.
 */
@Component({
  selector: 'app-nueva-venta',
  imports: [ComoUsar, PasoCliente, PasoProductos, PasoFormaPago, CronogramaDialogo, VentaRegistradaDialogo],
  templateUrl: './nueva-venta.html',
  styleUrl: './nueva-venta.css',
})
export class NuevaVenta {
  private readonly ventas = inject(VentaService);
  private readonly router = inject(Router);
  private readonly cronograma = viewChild.required(CronogramaDialogo);
  private readonly registrada = viewChild.required(VentaRegistradaDialogo);

  protected readonly paso = signal<Paso>(1);
  protected readonly cliente = signal<ClienteResumen | null>(null);
  protected readonly carrito = signal<ItemCarrito[]>([]);
  protected readonly cuotas = signal(1);

  protected readonly previa = signal<VentaResultado | null>(null);
  protected readonly cargandoPrevia = signal(false);
  protected readonly errorPrevia = signal<string | null>(null);
  protected readonly registrando = signal(false);
  private pedidoPrevia?: Subscription;

  protected readonly pasos = [
    'Paso 1: busca al cliente por nombre o DNI y elígelo. Verás su crédito disponible y sus fechas de corte y pago.',
    'Paso 2: agrega productos con "+" y ajusta las cantidades. Solo aparecen productos en la moneda del cliente.',
    'Paso 3: elige si cada producto se paga a fin de mes o en cuotas, y el número de cuotas. Revisa los intereses, el cronograma y la TCEA.',
    'Si la compra excede el crédito disponible, no se puede confirmar. Si es posterior a la fecha de corte, se pagará en el ciclo siguiente.',
    'Presiona "Confirmar venta" para registrarla.',
  ];

  protected readonly puedeIrAProductos = computed(() => this.cliente() !== null);
  protected readonly puedeIrAFormaPago = computed(
    () => this.carrito().length > 0 && this.carrito().every((i) => i.cantidad > 0),
  );
  protected readonly puedeConfirmar = computed(
    () => !!this.previa()?.aprobado && !this.cargandoPrevia() && !this.registrando(),
  );

  // ---------- Navegación ----------

  protected irA(paso: Paso): void {
    if (paso >= 2 && !this.puedeIrAProductos()) return;
    if (paso === 3 && !this.puedeIrAFormaPago()) return;
    this.paso.set(paso);
    if (paso === 3) this.pedirVistaPrevia();
  }

  // ---------- Cambios de cada paso ----------

  protected elegirCliente(c: ClienteResumen): void {
    if (this.cliente()?.cliente_id !== c.cliente_id) this.carrito.set([]); // otro cliente, otra moneda
    this.cliente.set(c);
    this.cuotas.set(Math.min(3, c.plazo_max_meses));
  }

  // El carrito se cambia siempre con update(): cada cambio parte del valor más reciente.

  /** "+": agrega 1 unidad (o suma 1 si el producto ya está en el carrito). */
  protected agregarProducto(p: ProductoVenta): void {
    this.carrito.update((carrito) => {
      const i = carrito.findIndex((x) => x.producto.producto_id === p.producto_id);
      if (i >= 0) {
        return carrito.map((x, j) => (j === i ? { ...x, cantidad: x.cantidad + 1 } : x));
      }
      // Modalidad inicial: fin de mes si el producto lo permite; si no, en meses.
      return [...carrito, { producto: p, cantidad: 1, modalidad: MODALIDADES_PERMITIDAS[p.forma_venta_credito][0] }];
    });
  }

  protected cambiarCantidad(e: { indice: number; cantidad: number }): void {
    this.carrito.update((c) => c.map((x, i) => (i === e.indice ? { ...x, cantidad: e.cantidad } : x)));
  }

  protected quitarProducto(indice: number): void {
    this.carrito.update((c) => c.filter((_, i) => i !== indice));
  }

  protected cambiarModalidad(e: { indice: number; modalidad: Modalidad }): void {
    this.carrito.update((c) => c.map((x, i) => (i === e.indice ? { ...x, modalidad: e.modalidad } : x)));
    this.pedirVistaPrevia();
  }

  protected cambiarCuotas(n: number): void {
    this.cuotas.set(n);
    this.pedirVistaPrevia();
  }

  protected abrirCronograma(g: GrupoVenta): void {
    this.cronograma().abrir(g, this.cliente()!.moneda);
  }

  // ---------- Llamadas al backend ----------

  private entrada(): VentaEntrada {
    const hayEnMeses = this.carrito().some((i) => i.modalidad === 'EN_MESES');
    return {
      cliente_id: this.cliente()!.cliente_id,
      items: this.carrito().map((i) => ({
        producto_id: i.producto.producto_id,
        cantidad: String(i.cantidad),
        modalidad: i.modalidad,
      })),
      cuotas: hayEnMeses ? this.cuotas() : null,
    };
  }

  /** Pide la vista previa; si llega una respuesta vieja, se descarta. */
  private pedirVistaPrevia(): void {
    this.pedidoPrevia?.unsubscribe();
    this.cargandoPrevia.set(true);
    this.errorPrevia.set(null);
    this.pedidoPrevia = this.ventas.vistaPrevia(this.entrada()).subscribe({
      next: (r) => {
        this.previa.set(r);
        this.cargandoPrevia.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.previa.set(null);
        this.cargandoPrevia.set(false);
        this.errorPrevia.set(e.error?.detail ?? 'No se pudo calcular la venta');
      },
    });
  }

  protected confirmar(): void {
    if (!this.puedeConfirmar()) return;
    this.registrando.set(true);
    this.ventas.registrar(this.entrada()).subscribe({
      next: (r) => {
        this.registrando.set(false);
        this.registrada().abrir(r);
      },
      error: (e: HttpErrorResponse) => {
        this.registrando.set(false);
        this.errorPrevia.set(e.error?.detail ?? 'No se pudo registrar la venta');
      },
    });
  }

  // ---------- Después de registrar ----------

  protected nuevaVenta(): void {
    this.cliente.set(null);
    this.carrito.set([]);
    this.previa.set(null);
    this.errorPrevia.set(null);
    this.paso.set(1);
  }

  protected salir(): void {
    this.router.navigateByUrl('/negocio/inicio');
  }
}
