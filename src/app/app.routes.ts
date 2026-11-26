import { Routes } from '@angular/router';

import { EnConstruccion } from './componentes/compartidos/en-construccion/en-construccion';
import { Layout } from './componentes/compartidos/layout/layout';
import { IniciarSesion } from './componentes/autenticacion/iniciar-sesion/iniciar-sesion';
import { InicioNegocioComponente } from './componentes/negocio/inicio-negocio/inicio-negocio';
import { NuevaVenta } from './componentes/ventas/nueva-venta/nueva-venta';
import { soloRol, soloSinSesion } from './servicios/autenticacion-guard';

/** Crea una ruta provisional (pantalla "En construcción"). */
const pendiente = (path: string, titulo: string, figura: string) => ({
  path,
  component: EnConstruccion,
  data: { titulo, figura },
  title: `${titulo} · Fiao`,
});

export const routes: Routes = [
  { path: 'login', component: IniciarSesion, canActivate: [soloSinSesion], title: 'Iniciar sesión · Fiao' },

  // Administrador del sistema (Fig. 2 a 5)
  {
    path: 'admin',
    component: Layout,
    canActivate: [soloRol('ADMIN_SISTEMA')],
    children: [pendiente('tiendas', 'Tiendas', 'las Fig. 2 a 5'), { path: '', redirectTo: 'tiendas', pathMatch: 'full' }],
  },

  // Administrador del negocio (Fig. 6 a 27)
  {
    path: 'negocio',
    component: Layout,
    canActivate: [soloRol('ADMIN_NEGOCIO')],
    children: [
      { path: 'inicio', component: InicioNegocioComponente, title: 'Inicio · Fiao' },
      pendiente('productos', 'Productos', 'las Fig. 7 y 8'),
      pendiente('clientes', 'Clientes', 'las Fig. 9 a 12'),
      { path: 'nueva-venta', component: NuevaVenta, title: 'Nueva venta · Fiao' },
      pendiente('registrar-pago', 'Registrar pago', 'las Fig. 20 a 22'),
      pendiente('listados', 'Listados de pago', 'las Fig. 23 y 24'),
      pendiente('reportes', 'Reportes', 'las Fig. 25 a 27'),
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    ],
  },

  // Cliente (Fig. 28 a 34)
  {
    path: 'cliente',
    component: Layout,
    canActivate: [soloRol('CLIENTE')],
    children: [
      pendiente('inicio', 'Inicio', 'la Fig. 28'),
      pendiente('mi-cuenta', 'Mi cuenta', 'las Fig. 29 y 30'),
      pendiente('mis-cuotas', 'Mis cuotas', 'la Fig. 31'),
      pendiente('mis-pagos', 'Mis pagos', 'las Fig. 32 y 33'),
      pendiente('mis-condiciones', 'Mis condiciones', 'la Fig. 34'),
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    ],
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
