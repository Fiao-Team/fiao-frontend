import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, computed, inject, output, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { ProductoEntrada, ProductoItem, UNIDADES_MEDIDA } from '../../../modelo/producto';
import { FormaVenta, Moneda } from '../../../modelo/venta';
import { ProductoService } from '../../../servicios/producto-service';
import { Ayuda } from '../../compartidos/ayuda/ayuda';
import { ComoUsar } from '../../compartidos/como-usar/como-usar';
import { Icono } from '../../compartidos/icono/icono';

/**
 * Modal para registrar o editar un producto del catálogo (Fig. 8).
 * Valida reglas de precios (contado > 0, lista > 0, lista >= contado) y refleja
 * errores por campo devueltos por el backend.
 */
@Component({
  selector: 'app-producto-formulario-dialogo',
  imports: [ReactiveFormsModule, Ayuda, ComoUsar, Icono],
  templateUrl: './producto-formulario-dialogo.html',
  styleUrl: './producto-formulario-dialogo.css',
})
export class ProductoFormularioDialogo {
  private readonly productos = inject(ProductoService);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  readonly guardado = output<ProductoItem>();

  protected readonly editando = signal<ProductoItem | null>(null);
  protected readonly esEdicion = computed(() => this.editando() !== null);
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly erroresCampo = signal<Record<string, string>>({});
  protected readonly unidades = UNIDADES_MEDIDA;

  protected readonly pasos = [
    'Escribe el nombre del producto y su unidad de medida (ej. Unidad, Bolsa, Lata, Kg).',
    'Elige la moneda (soles o dólares). Solo se podrá vender a clientes con esa misma moneda.',
    'Ingresa el precio al contado y el precio de lista para fiado (debe ser mayor o igual al de contado).',
    'Selecciona la modalidad permitida de crédito: Fin de mes, En cuotas o Ambas.',
  ];

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    nombre: [''],
    descripcion: [''],
    marca: [''],
    categoria: [''],
    proveedor: [''],
    unidad_medida: ['Unidad'],
    moneda: ['PEN' as Moneda],
    precio_contado: [''],
    precio_lista: [''],
    forma_venta_credito: ['FIN_DE_MES' as FormaVenta],
    imagen_url: [''],
  });

  abrirCrear(): void {
    this.editando.set(null);
    this.formulario.reset({
      nombre: '',
      descripcion: '',
      marca: '',
      categoria: '',
      proveedor: '',
      unidad_medida: 'Unidad',
      moneda: 'PEN',
      precio_contado: '',
      precio_lista: '',
      forma_venta_credito: 'FIN_DE_MES',
      imagen_url: '',
    });
    this.errorGeneral.set(null);
    this.erroresCampo.set({});
    this.dialogo().nativeElement.showModal();
  }

  abrirEditar(producto: ProductoItem): void {
    this.editando.set(producto);
    this.formulario.reset({
      nombre: producto.nombre,
      descripcion: '',
      marca: producto.marca ?? '',
      categoria: producto.categoria ?? '',
      proveedor: producto.proveedor ?? '',
      unidad_medida: producto.unidad_medida,
      moneda: producto.moneda,
      precio_contado: String(producto.precio_contado),
      precio_lista: String(producto.precio_lista),
      forma_venta_credito: producto.forma_venta_credito,
      imagen_url: producto.imagen_url ?? '',
    });
    this.errorGeneral.set(null);
    this.erroresCampo.set({});
    this.dialogo().nativeElement.showModal();
  }

  protected cerrar(): void {
    this.dialogo().nativeElement.close();
  }

  protected limpiarError(campo: string): void {
    if (!this.erroresCampo()[campo]) return;
    this.erroresCampo.update((actual) => {
      const copia = { ...actual };
      delete copia[campo];
      return copia;
    });
  }

  protected validarLocal(): Record<string, string> {
    const v = this.formulario.getRawValue();
    const errores: Record<string, string> = {};

    const nombre = v.nombre.trim();
    const unidad = v.unidad_medida.trim();
    const contado = Number(v.precio_contado);
    const lista = Number(v.precio_lista);

    if (nombre.length < 2) errores['nombre'] = 'Ingresa el nombre del producto (mínimo 2 caracteres).';
    else if (nombre.length > 80) errores['nombre'] = 'Máximo 80 caracteres.';

    if (!unidad) errores['unidad_medida'] = 'Ingresa la unidad de medida.';
    else if (unidad.length > 15) errores['unidad_medida'] = 'Máximo 15 caracteres.';

    if (!v.precio_contado.trim() || !Number.isFinite(contado) || contado <= 0) {
      errores['precio_contado'] = 'El precio al contado debe ser mayor a 0.';
    }

    if (!v.precio_lista.trim() || !Number.isFinite(lista) || lista <= 0) {
      errores['precio_lista'] = 'El precio de lista debe ser mayor a 0.';
    } else if (Number.isFinite(contado) && contado > 0 && lista < contado) {
      errores['precio_lista'] = 'El precio de lista no puede ser menor al precio al contado.';
    }

    return errores;
  }

  protected guardar(): void {
    this.errorGeneral.set(null);
    const errores = this.validarLocal();
    this.erroresCampo.set(errores);
    if (Object.keys(errores).length > 0) return;

    const v = this.formulario.getRawValue();
    const payload: ProductoEntrada = {
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim() || null,
      marca: v.marca.trim() || null,
      categoria: v.categoria.trim() || null,
      proveedor: v.proveedor.trim() || null,
      unidad_medida: v.unidad_medida.trim(),
      moneda: v.moneda,
      precio_contado: Number(v.precio_contado).toFixed(2),
      precio_lista: Number(v.precio_lista).toFixed(2),
      forma_venta_credito: v.forma_venta_credito,
      imagen_url: v.imagen_url.trim() || null,
    };

    this.enviando.set(true);
    const actual = this.editando();
    const peticion = actual
      ? this.productos.actualizar(actual.producto_id, payload)
      : this.productos.registrar(payload);

    peticion.subscribe({
      next: (producto) => {
        this.enviando.set(false);
        this.cerrar();
        this.guardado.emit(producto);
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        const porCampo = e.error?.errores as Record<string, string> | undefined;
        if (porCampo && Object.keys(porCampo).length > 0) {
          this.erroresCampo.set(porCampo);
          return;
        }
        this.errorGeneral.set(
          e.status === 0
            ? 'No se pudo conectar con el servidor. Intenta de nuevo en un momento.'
            : (e.error?.detail ?? 'No se pudo guardar el producto.'),
        );
      },
    });
  }
}
