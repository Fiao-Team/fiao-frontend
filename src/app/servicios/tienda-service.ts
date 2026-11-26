import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  EstadoFiltroTienda,
  TiendaActualizarEntrada,
  TiendaCrearEntrada,
  TiendaItem,
  TiendaListadoSalida,
} from '../modelo/tienda';

export interface FiltrosTienda {
  buscar?: string;
  giro?: string;
  estado?: EstadoFiltroTienda;
}

/** Llamadas a la API de tiendas (/tiendas). Solo para ADMIN_SISTEMA. */
@Injectable({ providedIn: 'root' })
export class TiendaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/tiendas`;

  /** Fig. 2: listado de tiendas con KPIs, giros disponibles y filtros. */
  listar(filtros: FiltrosTienda = {}): Observable<TiendaListadoSalida> {
    let params = new HttpParams();
    if (filtros.buscar?.trim()) params = params.set('buscar', filtros.buscar.trim());
    if (filtros.giro?.trim()) params = params.set('giro', filtros.giro.trim());
    if (filtros.estado && filtros.estado !== 'TODAS') params = params.set('estado', filtros.estado);
    return this.http.get<TiendaListadoSalida>(this.url, { params });
  }

  /** Obtiene una tienda específica por ID. */
  obtener(tiendaId: number): Observable<TiendaItem> {
    return this.http.get<TiendaItem>(`${this.url}/${tiendaId}`);
  }

  /** Fig. 3 y 4: registra una nueva tienda y su administrador de negocio. */
  registrar(datos: TiendaCrearEntrada): Observable<TiendaItem> {
    return this.http.post<TiendaItem>(this.url, datos);
  }

  /** Fig. 2: edita los datos de una tienda y su dueño. */
  actualizar(tiendaId: number, datos: TiendaActualizarEntrada): Observable<TiendaItem> {
    return this.http.put<TiendaItem>(`${this.url}/${tiendaId}`, datos);
  }

  /** Fig. 5: da de baja lógica una tienda (bloquea dueño y clientes). */
  darDeBaja(tiendaId: number): Observable<TiendaItem> {
    return this.http.patch<TiendaItem>(`${this.url}/${tiendaId}/baja`, {});
  }

  /** Fig. 2 y 5: reactiva una tienda previamente dada de baja. */
  reactivar(tiendaId: number): Observable<TiendaItem> {
    return this.http.patch<TiendaItem>(`${this.url}/${tiendaId}/activar`, {});
  }
}
