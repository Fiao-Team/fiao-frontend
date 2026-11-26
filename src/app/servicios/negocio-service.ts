import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { InicioNegocio } from '../modelo/negocio';

/** Llamadas a la API de inicio del negocio (/negocio). Solo para ADMIN_NEGOCIO. */
@Injectable({ providedIn: 'root' })
export class NegocioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/negocio`;

  /** Fig. 6: KPIs, próximos vencimientos y clientes en mora del negocio. */
  obtenerInicio(): Observable<InicioNegocio> {
    return this.http.get<InicioNegocio>(`${this.url}/inicio`);
  }
}
