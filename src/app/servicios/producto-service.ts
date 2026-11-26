import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ProductoEntrada, ProductoItem } from '../modelo/producto';
import { FormaVenta, Moneda } from '../modelo/venta';

export interface FiltrosProducto {
  buscar?: string;
  categoria?: string;
  moneda?: Moneda | '';
  forma_venta?: FormaVenta | '';
  solo_activos?: boolean;
}

/** Llamadas a la API de productos (/productos). Solo para ADMIN_NEGOCIO. */
@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/productos`;

  /** Fig. 7: lista los productos del catálogo de la tienda con filtros opcionales. */
  listar(filtros: FiltrosProducto = {}): Observable<ProductoItem[]> {
    let params = new HttpParams();
    if (filtros.buscar?.trim()) params = params.set('buscar', filtros.buscar.trim());
    if (filtros.categoria?.trim()) params = params.set('categoria', filtros.categoria.trim());
    if (filtros.moneda) params = params.set('moneda', filtros.moneda);
    if (filtros.forma_venta) params = params.set('forma_venta', filtros.forma_venta);
    if (filtros.solo_activos === false) params = params.set('solo_activos', 'false');
    return this.http.get<ProductoItem[]>(this.url, { params });
  }

  /** Obtiene el detalle de un producto específico de la tienda. */
  obtener(productoId: number): Observable<ProductoItem> {
    return this.http.get<ProductoItem>(`${this.url}/${productoId}`);
  }

  /** Fig. 8: registra un nuevo producto en el catálogo de la tienda. */
  registrar(datos: ProductoEntrada): Observable<ProductoItem> {
    return this.http.post<ProductoItem>(this.url, datos);
  }

  /** Actualiza un producto existente de la tienda. */
  actualizar(productoId: number, datos: ProductoEntrada): Observable<ProductoItem> {
    return this.http.put<ProductoItem>(`${this.url}/${productoId}`, datos);
  }

  /** Baja lógica de un producto (estado = 0). */
  darDeBaja(productoId: number): Observable<ProductoItem> {
    return this.http.patch<ProductoItem>(`${this.url}/${productoId}/baja`, {});
  }

  /** Reactiva un producto dado de baja (estado = 1). */
  reactivar(productoId: number): Observable<ProductoItem> {
    return this.http.patch<ProductoItem>(`${this.url}/${productoId}/activar`, {});
  }
}
