import { Component, ElementRef, input, viewChild } from '@angular/core';

import { Icono } from '../icono/icono';

/**
 * Botón "¿Cómo usar esta pantalla?" (lo pide el enunciado en cada pantalla).
 * Abre un panel lateral derecho (drawer) con los pasos numerados, fiel a los mockups TB1.
 *
 * Uso:  <app-como-usar titulo="Tiendas" [pasos]="['Paso 1...', 'Paso 2...']" />
 */
@Component({
  selector: 'app-como-usar',
  imports: [Icono],
  templateUrl: './como-usar.html',
  styleUrl: './como-usar.css',
})
export class ComoUsar {
  readonly titulo = input.required<string>();
  readonly pasos = input.required<string[]>();
  /** 'boton' (por defecto) o 'enlace' (texto pequeño, para pantallas simples o modales). */
  readonly variante = input<'boton' | 'enlace'>('boton');
  /** Texto del botón o enlace. */
  readonly etiqueta = input('¿Cómo usar esta pantalla?');
  /** Nota informativa inferior del panel lateral. */
  readonly nota = input('Sigue estos pasos para completar tu tarea sin errores.');
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  /** Cierra el panel si se hace clic en el fondo oscuro. */
  protected cerrarSiFondo(evento: MouseEvent): void {
    if (evento.target === this.dialogo().nativeElement) this.dialogo().nativeElement.close();
  }
}
