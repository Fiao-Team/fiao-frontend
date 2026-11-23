import { Component, input } from '@angular/core';

/** Íconos disponibles. Para agregar uno: sumarlo aquí y su dibujo en icono.html. */
export type NombreIcono =
  | 'ojo' | 'ojo-cerrado' | 'menu' | 'salir' | 'llave' | 'flecha-abajo'
  | 'buscar' | 'mas' | 'quitar' | 'check' | 'alerta' | 'calendario' | 'basura';

/**
 * Ícono en SVG (dibujos de Lucide, https://lucide.dev, licencia ISC).
 * Toma el color del texto que lo rodea (currentColor).
 *
 * Uso:  <app-icono nombre="ojo" />   o   <app-icono nombre="menu" [tamano]="24" />
 */
@Component({
  selector: 'app-icono',
  templateUrl: './icono.html',
  styleUrl: './icono.css',
})
export class Icono {
  readonly nombre = input.required<NombreIcono>();
  readonly tamano = input(20);
}
