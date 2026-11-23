import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Rol } from '../modelo/autenticacion';
import { SesionService } from './sesion-service';

/**
 * Candado de rutas: deja entrar solo a los roles indicados.
 * - Sin sesión -> al login.
 * - Con sesión de otro rol -> a su propio inicio.
 *
 * Es solo para la navegación; la seguridad real está en el backend.
 */
export function soloRol(...roles: Rol[]): CanActivateFn {
  return () => {
    const sesion = inject(SesionService);
    const router = inject(Router);
    const s = sesion.sesion();
    if (!s) return router.parseUrl('/login');
    if (!roles.includes(s.rol)) return router.parseUrl(sesion.inicio());
    return true;
  };
}

/** Para la página de login: si ya hay sesión, lleva directo a su inicio. */
export const soloSinSesion: CanActivateFn = () => {
  const sesion = inject(SesionService);
  return sesion.conectado() ? inject(Router).parseUrl(sesion.inicio()) : true;
};
