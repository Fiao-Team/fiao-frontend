import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Rol } from '../../../modelo/autenticacion';
import { SesionService } from '../../../servicios/sesion-service';

interface OpcionMenu {
  texto: string;
  ruta: string;
}

/** Opciones del menú según el rol (mockups Fig. 2, 6 y 28). */
const MENU_POR_ROL: Record<Rol, OpcionMenu[]> = {
  ADMIN_SISTEMA: [{ texto: 'Tiendas', ruta: '/admin/tiendas' }],
  ADMIN_NEGOCIO: [
    { texto: 'Inicio', ruta: '/negocio/inicio' },
    { texto: 'Productos', ruta: '/negocio/productos' },
    { texto: 'Clientes', ruta: '/negocio/clientes' },
    { texto: 'Nueva venta', ruta: '/negocio/nueva-venta' },
    { texto: 'Registrar pago', ruta: '/negocio/registrar-pago' },
    { texto: 'Listados de pago', ruta: '/negocio/listados' },
    { texto: 'Reportes', ruta: '/negocio/reportes' },
  ],
  CLIENTE: [
    { texto: 'Inicio', ruta: '/cliente/inicio' },
    { texto: 'Mi cuenta', ruta: '/cliente/mi-cuenta' },
    { texto: 'Mis cuotas', ruta: '/cliente/mis-cuotas' },
    { texto: 'Mis pagos', ruta: '/cliente/mis-pagos' },
    { texto: 'Mis condiciones', ruta: '/cliente/mis-condiciones' },
  ],
};

/** Barra lateral con las opciones del rol conectado. */
@Component({
  selector: 'app-menu-lateral',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu-lateral.html',
  styleUrl: './menu-lateral.css',
  host: { '[class.abierto]': 'abierto()' },
})
export class MenuLateral {
  private readonly sesion = inject(SesionService);

  /** En celular: si el menú está desplegado. */
  readonly abierto = input(false);
  /** Avisa que se eligió una opción (en celular, para cerrar el menú). */
  readonly navego = output<void>();

  protected readonly opciones = computed(() => {
    const s = this.sesion.sesion();
    return s ? MENU_POR_ROL[s.rol] : [];
  });
}
