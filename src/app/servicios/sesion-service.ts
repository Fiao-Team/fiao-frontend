import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { INICIO_POR_ROL, LoginRespuesta, Sesion } from '../modelo/autenticacion';

const CLAVE = 'fiao.sesion';

/**
 * Maneja la sesión: iniciar, cerrar y saber quién está conectado.
 *
 * El token se guarda en el navegador (localStorage) para no perder la sesión
 * al recargar. Ojo: el frontend solo decide qué MOSTRAR; quién puede ver qué
 * datos lo valida siempre el backend con el token.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _sesion = signal<Sesion | null>(leerGuardada());

  /** Sesión actual (o null si nadie inició sesión). */
  readonly sesion = this._sesion.asReadonly();
  readonly conectado = computed(() => this._sesion() !== null);

  iniciarSesion(username: string, password: string): Observable<LoginRespuesta> {
    return this.http
      .post<LoginRespuesta>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap((r) => {
          const sesion: Sesion = {
            token: r.access_token,
            rol: r.rol,
            nombres: r.nombres,
            tiendaId: r.tienda_id,
            clienteId: r.cliente_id,
          };
          guardar(sesion);
          this._sesion.set(sesion);
        }),
      );
  }

  /** Cambia la contraseña del usuario conectado (POST /auth/cambiar-contrasena). */
  cambiarContrasena(passwordActual: string, passwordNueva: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/cambiar-contrasena`, {
      password_actual: passwordActual,
      password_nueva: passwordNueva,
    });
  }

  cerrarSesion(): void {
    guardar(null);
    this._sesion.set(null);
    this.router.navigateByUrl('/login');
  }

  /** Ruta de inicio que le corresponde al usuario conectado. */
  inicio(): string {
    const s = this._sesion();
    return s ? INICIO_POR_ROL[s.rol] : '/login';
  }
}

function leerGuardada(): Sesion | null {
  try {
    const texto = localStorage.getItem(CLAVE);
    return texto ? (JSON.parse(texto) as Sesion) : null;
  } catch {
    return null;
  }
}

function guardar(sesion: Sesion | null): void {
  try {
    if (sesion) localStorage.setItem(CLAVE, JSON.stringify(sesion));
    else localStorage.removeItem(CLAVE);
  } catch {
    // Si el navegador no permite guardar, la sesión dura solo hasta recargar.
  }
}
