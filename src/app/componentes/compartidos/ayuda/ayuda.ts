import { Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';

/**
 * Ícono "?" de ayuda de un campo (lo pide el enunciado en cada formulario).
 * Al presionarlo muestra un globo con el texto; se cierra al hacer clic fuera.
 * Se posiciona automáticamente a la izquierda/arriba si no hay espacio a la derecha.
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
  protected readonly alinearDerecha = signal(false);
  private readonly elemento = inject(ElementRef<HTMLElement>);

  protected alternar(): void {
    const abrir = !this.abierto();
    if (abrir) {
      const rect = this.elemento.nativeElement.getBoundingClientRect();
      const limite =
        this.elemento.nativeElement.closest('dialog')?.getBoundingClientRect().right ??
        window.innerWidth;
      this.alinearDerecha.set(limite - rect.right < 260);
    }
    this.abierto.set(abrir);
  }

  @HostListener('document:click', ['$event.target'])
  cerrarSiClicFuera(destino: EventTarget | null): void {
    if (!this.elemento.nativeElement.contains(destino as Node)) this.abierto.set(false);
  }
}
