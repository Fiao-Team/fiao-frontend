// Tipos de la sesión y del inicio de sesión (comparten forma con la API).

export type Rol = 'ADMIN_SISTEMA' | 'ADMIN_NEGOCIO' | 'CLIENTE';

/** Respuesta de POST /auth/login */
export interface LoginRespuesta {
  access_token: string;
  token_type: string;
  rol: Rol;
  nombres: string;
  tienda_id: number | null;
  cliente_id: number | null;
}

/** Lo que el frontend recuerda de la sesión. */
export interface Sesion {
  token: string;
  rol: Rol;
  nombres: string;
  tiendaId: number | null;
  clienteId: number | null;
}

/** Pantalla de inicio de cada rol. */
export const INICIO_POR_ROL: Record<Rol, string> = {
  ADMIN_SISTEMA: '/admin/tiendas',
  ADMIN_NEGOCIO: '/negocio/inicio',
  CLIENTE: '/cliente/inicio',
};

/** Nombre del rol que se muestra en la cabecera. */
export const NOMBRE_ROL: Record<Rol, string> = {
  ADMIN_SISTEMA: 'Administrador del sistema',
  ADMIN_NEGOCIO: 'Administrador del negocio',
  CLIENTE: 'Cliente',
};
