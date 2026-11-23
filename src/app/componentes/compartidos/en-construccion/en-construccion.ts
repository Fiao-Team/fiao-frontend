import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { SesionService } from '../../../servicios/sesion-service';
import { ComoUsar } from '../como-usar/como-usar';

/**
 * Pantalla provisional para las opciones del menú que aún no se construyen.
 * Muestra el título y la figura del mockup que le corresponde (datos de la ruta).
 */
@Component({
  selector: 'app-en-construccion',
  imports: [ComoUsar],
  templateUrl: './en-construccion.html',
  styleUrl: './en-construccion.css',
})
export class EnConstruccion {
  protected readonly sesion = inject(SesionService);
  protected readonly datos = toSignal(inject(ActivatedRoute).data);
}
