import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Cabecera } from '../cabecera/cabecera';
import { MenuLateral } from '../menu-lateral/menu-lateral';

/**
 * Marco de la app para usuarios conectados: menú lateral, cabecera y,
 * al centro, la pantalla de la ruta actual.
 */
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Cabecera, MenuLateral],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  /** En celular el menú lateral se abre con ☰ y se cierra al elegir una opción. */
  protected readonly menuAbierto = signal(false);
}
