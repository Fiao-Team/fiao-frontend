import { Component, ElementRef, HostListener, computed, inject, output, signal } from '@angular/core';

import { NOMBRE_ROL } from '../../../modelo/autenticacion';
import { SesionService } from '../../../servicios/sesion-service';
import { CambiarContrasena } from '../../autenticacion/cambiar-contrasena/cambiar-contrasena';
import { Icono } from '../icono/icono';

/**
 * Barra superior: nombre y rol del usuario. Al presionarlos se abre el menú
 * con "Cambiar contraseña" y "Cerrar sesión" (Fig. 2).
 */
@Component({
  selector: 'app-cabecera',
  imports: [Icono, CambiarContrasena],
  templateUrl: './cabecera.html',
  styleUrl: './cabecera.css',
})
export class Cabecera {
  protected readonly sesion = inject(SesionService);
  private readonly elemento = inject(ElementRef);

  /** En celular: se presionó el botón para abrir el menú lateral. */
  readonly abrirMenu = output<void>();

  /** Menú del usuario (desplegable). */
  protected readonly menuUsuarioAbierto = signal(false);

  protected readonly nombreRol = computed(() => {
    const s = this.sesion.sesion();
    return s ? NOMBRE_ROL[s.rol] : '';
  });

  /** Iniciales para el círculo (ej. "José Ramírez" -> "JR"). */
  protected readonly iniciales = computed(() =>
    (this.sesion.sesion()?.nombres ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join(''),
  );

  /** Cierra el menú del usuario al hacer clic fuera de la cabecera. */
  @HostListener('document:click', ['$event.target'])
  cerrarSiClicFuera(destino: EventTarget | null): void {
    if (!this.elemento.nativeElement.contains(destino)) this.menuUsuarioAbierto.set(false);
  }
}
