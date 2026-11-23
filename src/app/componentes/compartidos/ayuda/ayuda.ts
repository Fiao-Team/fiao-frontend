import { Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';

/**
 * Ícono "?" de ayuda de un campo (lo pide el enunciado en cada formulario).
 * Al presionarlo muestra un globo con el texto; se cierra al hacer clic fuera.
 *
 * Uso:  <label>RUC <app-ayuda texto="11 dígitos, empieza con 10 o 20." /></label>
 */
@Component({
  selector: 'app-ayuda',
  templateUrl: './ayuda.html',
  styleUrl: './ayuda.css',
})
export class Ayuda {
  readonly texto = input.required<string>();
  protected readonly abierto = signal(false);
  private readonly elemento = inject(ElementRef);

  @HostListener('document:click', ['$event.target'])
  cerrarSiClicFuera(destino: EventTarget | null): void {
    if (!this.elemento.nativeElement.contains(destino)) this.abierto.set(false);
  }
}
