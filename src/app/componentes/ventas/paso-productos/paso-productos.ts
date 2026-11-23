import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';

import { dinero } from '../../../modelo/formato';
import { ClienteResumen, ItemCarrito, ProductoVenta } from '../../../modelo/venta';
import { VentaService } from '../../../servicios/venta-service';
import { Ayuda } from '../../compartidos/ayuda/ayuda';
import { Icono } from '../../compartidos/icono/icono';

/** Subtotal referencial en céntimos enteros (evita errores de redondeo del navegador). */
export function subtotalCentimos(item: ItemCarrito): number {
  const precio = Math.round(Number(item.producto.precio_lista) * 100);
  return Math.round(item.cantidad * precio);
}

/** Nueva venta, paso 2 (Fig. 14): elegir productos y cantidades. */
@Component({
  selector: 'app-paso-productos',
  imports: [Ayuda, Icono],
  templateUrl: './paso-productos.html',
  styleUrl: './paso-productos.css',
})
export class PasoProductos implements OnInit {
  private readonly ventas = inject(VentaService);

  readonly cliente = input.required<ClienteResumen>();
  readonly carrito = input.required<ItemCarrito[]>();
  // Este paso solo AVISA los cambios; el carrito lo actualiza nueva-venta sobre su
  // valor más reciente, así dos clics seguidos en "+" nunca se pisan.
  readonly agregar = output<ProductoVenta>();
  readonly cambiarCantidad = output<{ indice: number; cantidad: number }>();
  readonly quitar = output<number>();

  protected readonly productos = signal<ProductoVenta[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly dinero = dinero;
  private espera?: ReturnType<typeof setTimeout>;

  /** Total referencial del carrito (el oficial lo calcula el backend en el paso 3). */
  protected readonly total = computed(() => {
    const centimos = this.carrito().reduce((s, i) => s + subtotalCentimos(i), 0);
    return (centimos / 100).toFixed(2);
  });

  ngOnInit(): void {
    this.cargar('');
  }

  protected alEscribir(texto: string): void {
    clearTimeout(this.espera);
    this.espera = setTimeout(() => this.cargar(texto), 300);
  }

  private cargar(texto: string): void {
    this.ventas.productos(this.cliente().cliente_id, texto).subscribe({
      next: (p) => this.productos.set(p),
      error: (e: HttpErrorResponse) => this.error.set(e.error?.detail ?? 'No se pudo cargar los productos'),
    });
  }

  protected cantidadEnCarrito(p: ProductoVenta): number {
    return this.carrito().find((i) => i.producto.producto_id === p.producto_id)?.cantidad ?? 0;
  }

  protected alCambiarCantidad(indice: number, valor: string): void {
    const cantidad = Number(valor);
    this.cambiarCantidad.emit({ indice, cantidad: Number.isFinite(cantidad) ? cantidad : 0 });
  }

  protected subtotal(item: ItemCarrito): string {
    return (subtotalCentimos(item) / 100).toFixed(2);
  }
}
