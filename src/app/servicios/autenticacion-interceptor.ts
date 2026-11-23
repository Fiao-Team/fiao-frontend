import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { SesionService } from './sesion-service';

/**
 * Se ejecuta en CADA petición a la API:
 * 1. Agrega el token ("Authorization: Bearer ...") si hay sesión.
 * 2. Si la API responde 401 (token vencido o inválido) o 403 por cuenta
 *    inactiva, cierra la sesión y vuelve al login.
 */
export const autenticacionInterceptor: HttpInterceptorFn = (req, next) => {
  const sesion = inject(SesionService);
  const token = sesion.sesion()?.token;

  const conToken = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(conToken).pipe(
    catchError((error: HttpErrorResponse) => {
      const esLogin = req.url.endsWith('/auth/login');
      const cuentaInactiva = error.status === 403 && error.error?.detail === 'Cuenta inactiva';
      if (!esLogin && token && (error.status === 401 || cuentaInactiva)) {
        sesion.cerrarSesion();
      }
      return throwError(() => error);
    }),
  );
};
