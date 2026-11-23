import { Component, ElementRef, input, viewChild } from '@angular/core';

/**
 * Botón "¿Cómo usar esta pantalla?" (lo pide el enunciado en cada pantalla).
 * Abre una ventana con los pasos para usar la pantalla.
 *
 * Uso:  <app-como-usar titulo="Inicio de sesión" [pasos]="['Escribe...', '...']" />
 */
@Component({
  selector: 'app-como-usar',
  templateUrl: './como-usar.html',
  styleUrl: './como-usar.css',
})
export class ComoUsar {
  readonly titulo = input.required<string>();
  readonly pasos = input.required<string[]>();
  /** 'boton' (por defecto) o 'enlace' (texto pequeño, para pantallas simples como el login). */
  readonly variante = input<'boton' | 'enlace'>('boton');
  /** Texto del botón o enlace. */
  readonly etiqueta = input('¿Cómo usar esta pantalla?');
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  /** Cierra la ventana si se hace clic en el fondo oscuro. */
  protected cerrarSiFondo(evento: MouseEvent): void {
    if (evento.target === this.dialogo().nativeElement) this.dialogo().nativeElement.close();
  }
}
