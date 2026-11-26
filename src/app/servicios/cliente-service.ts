import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  ClienteActualizarEntrada,
  ClienteCrearEntrada,
  ClienteItem,
  VistaPreviaTasasEntrada,
  VistaPreviaTasasRespuesta,
} from '../modelo/cliente';
import { Moneda } from '../modelo/venta';

export interface FiltrosCliente {
  buscar?: string;
  moneda?: Moneda | '';
  solo_activos?: boolean;
}

/** Llamadas a la API de clientes (/clientes). Solo para ADMIN_NEGOCIO. */
@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/clientes`;

  /** Fig. 9: lista clientes de la tienda con límite, saldo usado y disponible. */
  listar(filtros: FiltrosCliente = {}): Observable<ClienteItem[]> {
    let params = new HttpParams();
    if (filtros.buscar?.trim()) params = params.set('buscar', filtros.buscar.trim());
    if (filtros.moneda) params = params.set('moneda', filtros.moneda);
    if (filtros.solo_activos === false) params = params.set('solo_activos', 'false');
    return this.http.get<ClienteItem[]>(this.url, { params });
  }

  /** Fig. 10–11: calcula TEA compensatoria/moratoria y verifica topes BCRP vigentes. */
  vistaPreviaTasas(datos: VistaPreviaTasasEntrada): Observable<VistaPreviaTasasRespuesta> {
    return this.http.post<VistaPreviaTasasRespuesta>(`${this.url}/vista-previa-tasas`, datos);
  }

  /** Obtiene el detalle de un cliente de la tienda. */
  obtener(clienteId: number): Observable<ClienteItem> {
    return this.http.get<ClienteItem>(`${this.url}/${clienteId}`);
  }

  /** Fig. 10–11: registra un cliente, valida topes BCRP y crea su usuario CLIENTE. */
  registrar(datos: ClienteCrearEntrada): Observable<ClienteItem> {
    return this.http.post<ClienteItem>(this.url, datos);
  }

  /** Actualiza datos de contacto, límite de crédito, ciclo y tasas. */
  actualizar(clienteId: number, datos: ClienteActualizarEntrada): Observable<ClienteItem> {
    return this.http.put<ClienteItem>(`${this.url}/${clienteId}`, datos);
  }

  /** Fig. 12: baja lógica (rechaza con 400 si tiene saldo deudor > 0). */
  darDeBaja(clienteId: number): Observable<ClienteItem> {
    return this.http.patch<ClienteItem>(`${this.url}/${clienteId}/baja`, {});
  }

  /** Reactiva un cliente previamente dado de baja. */
  reactivar(clienteId: number): Observable<ClienteItem> {
    return this.http.patch<ClienteItem>(`${this.url}/${clienteId}/activar`, {});
  }
}
