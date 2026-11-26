import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { Subscription } from 'rxjs';

import { dinero } from '../../../modelo/formato';
import { ETIQUETA_FORMA_VENTA, ProductoItem } from '../../../modelo/producto';
import { FormaVenta, Moneda } from '../../../modelo/venta';
import { ProductoService } from '../../../servicios/producto-service';
import { Ayuda } from '../../compartidos/ayuda/ayuda';
import { ComoUsar } from '../../compartidos/como-usar/como-usar';
import { Icono } from '../../compartidos/icono/icono';
import { ProductoEstadoDialogo } from '../producto-estado-dialogo/producto-estado-dialogo';
import { ProductoFormularioDialogo } from '../producto-formulario-dialogo/producto-formulario-dialogo';

/**
 * Catálogo de productos del Administrador del negocio (Fig. 7 y 8).
 * Permite listar con filtros, registrar, editar, dar de baja lógica y reactivar productos.
 */
@Component({
  selector: 'app-productos',
  imports: [Ayuda, ComoUsar, Icono, ProductoFormularioDialogo, ProductoEstadoDialogo],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos implements OnInit, OnDestroy {
  private readonly servicio = inject(ProductoService);
  private readonly formularioDialogo = viewChild.required(ProductoFormularioDialogo);
  private readonly estadoDialogo = viewChild.required(ProductoEstadoDialogo);

  protected readonly productos = signal<ProductoItem[]>([]);
  protected readonly buscar = signal('');
  protected readonly categoria = signal('');
  protected readonly moneda = signal<Moneda | ''>('');
  protected readonly formaVenta = signal<FormaVenta | ''>('');
  protected readonly mostrarInactivos = signal(false);

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  protected readonly dinero = dinero;
  protected readonly etiquetasForma = ETIQUETA_FORMA_VENTA;

  private espera?: ReturnType<typeof setTimeout>;
  private pedido?: Subscription;

  protected readonly pasos = [
    'Usa los filtros para buscar productos por nombre, marca, proveedor, categoría, moneda o modalidad de fiado.',
    'Presiona "+ Nuevo producto" para agregar un artículo indicando precio al contado, precio de lista (fiado) y moneda.',
    'Recuerda que en las ventas al crédito se usa el precio de lista, y cada producto solo se vende a clientes en su misma moneda.',
    'Puedes dar de baja un producto para ocultarlo de Nueva venta sin perder el historial, y activar "Mostrar inactivos" si deseas reactivarlo.',
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
    this.programarCarga();
  }

  protected alCambiarCategoria(texto: string): void {
    this.categoria.set(texto);
    this.programarCarga();
  }

  protected alCambiarMoneda(valor: string): void {
    this.moneda.set(valor as Moneda | '');
    this.cargar();
  }

  protected alCambiarFormaVenta(valor: string): void {
    this.formaVenta.set(valor as FormaVenta | '');
    this.cargar();
  }

  protected alAlternarInactivos(mostrar: boolean): void {
    this.mostrarInactivos.set(mostrar);
    this.cargar();
  }

  private programarCarga(): void {
    clearTimeout(this.espera);
    this.espera = setTimeout(() => this.cargar(), 300);
  }

  protected cargar(): void {
    this.pedido?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);

    this.pedido = this.servicio
      .listar({
        buscar: this.buscar(),
        categoria: this.categoria(),
        moneda: this.moneda(),
        forma_venta: this.formaVenta(),
        solo_activos: !this.mostrarInactivos(),
      })
      .subscribe({
        next: (lista) => {
          this.productos.set(lista);
          this.cargando.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.cargando.set(false);
          this.error.set(
            e.status === 0
              ? 'No se pudo conectar con el servidor. Intenta de nuevo en un momento.'
              : (e.error?.detail ?? 'No se pudo cargar el catálogo de productos.'),
          );
        },
      });
  }

  protected nuevoProducto(): void {
    this.aviso.set(null);
    this.formularioDialogo().abrirCrear();
  }

  protected editarProducto(p: ProductoItem): void {
    this.aviso.set(null);
    this.formularioDialogo().abrirEditar(p);
  }

  protected confirmarBaja(p: ProductoItem): void {
    this.aviso.set(null);
    this.estadoDialogo().abrirBaja(p);
  }

  protected confirmarReactivar(p: ProductoItem): void {
    this.aviso.set(null);
    this.estadoDialogo().abrirReactivar(p);
  }

  protected alGuardar(producto: ProductoItem): void {
    this.aviso.set(`Producto "${producto.nombre}" guardado correctamente.`);
    this.cargar();
  }

  protected alCambiarEstado(producto: ProductoItem): void {
    const accion = producto.estado === 1 ? 'reactivado' : 'dado de baja';
    this.aviso.set(`Producto "${producto.nombre}" ${accion} correctamente.`);
    this.cargar();
  }

  protected formatoPrecio(moneda: Moneda, monto: string | number): string {
    return this.dinero(moneda, String(monto));
  }
}
