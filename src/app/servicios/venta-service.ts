import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  ClienteBusqueda,
  ClienteResumen,
  ProductoVenta,
  VentaEntrada,
  VentaResultado,
} from '../modelo/venta';

/** Llamadas a la API de ventas (/ventas). La tienda la decide el backend con el token. */
@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/ventas`;

  /** Paso 1: clientes activos por nombre o DNI. */
  buscarClientes(texto: string): Observable<ClienteBusqueda[]> {
    return this.http.get<ClienteBusqueda[]>(`${this.url}/clientes`, { params: { buscar: texto } });
  }

  /** Paso 1: disponible, corte y fecha de pago del cliente. */
  resumenCliente(clienteId: number): Observable<ClienteResumen> {
    return this.http.get<ClienteResumen>(`${this.url}/clientes/${clienteId}`);
  }

  /** Paso 2: productos en la moneda del cliente. */
  productos(clienteId: number, texto = ''): Observable<ProductoVenta[]> {
    return this.http.get<ProductoVenta[]>(`${this.url}/productos`, {
      params: { cliente_id: clienteId, buscar: texto },
    });
  }

  /** Paso 3: calcula intereses, cronograma y TCEA sin guardar. */
  vistaPrevia(venta: VentaEntrada): Observable<VentaResultado> {
    return this.http.post<VentaResultado>(`${this.url}/vista-previa`, venta);
  }

  /** Registra la venta. */
  registrar(venta: VentaEntrada): Observable<VentaResultado> {
    return this.http.post<VentaResultado>(this.url, venta);
  }
}
