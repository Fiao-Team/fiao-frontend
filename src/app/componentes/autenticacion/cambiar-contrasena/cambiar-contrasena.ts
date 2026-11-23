import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { SesionService } from '../../../servicios/sesion-service';
import { Ayuda } from '../../compartidos/ayuda/ayuda';
import { ComoUsar } from '../../compartidos/como-usar/como-usar';
import { Icono } from '../../compartidos/icono/icono';

const LARGO_MINIMO = 8; // igual que en el backend

/** Valida que "Repite la contraseña nueva" coincida con la nueva. */
function clavesCoinciden(grupo: AbstractControl): ValidationErrors | null {
  const { nueva, repetir } = grupo.value;
  return nueva && repetir && nueva !== repetir ? { noCoinciden: true } : null;
}

/**
 * Ventana para cambiar la contraseña del usuario conectado (cualquier rol).
 * Se abre desde el menú del usuario en la cabecera con `abrir()`.
 */
@Component({
  selector: 'app-cambiar-contrasena',
  imports: [ReactiveFormsModule, Ayuda, ComoUsar, Icono],
  templateUrl: './cambiar-contrasena.html',
  styleUrl: './cambiar-contrasena.css',
})
export class CambiarContrasena {
  private readonly sesion = inject(SesionService);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  protected readonly largoMinimo = LARGO_MINIMO;
  protected readonly formulario = inject(FormBuilder).nonNullable.group(
    {
      actual: ['', Validators.required],
      nueva: ['', [Validators.required, Validators.minLength(LARGO_MINIMO)]],
      repetir: ['', Validators.required],
    },
    { validators: clavesCoinciden },
  );

  /** Qué campos muestran su contraseña (cada uno con su propio ojo). */
  protected readonly ver = signal({ actual: false, nueva: false, repetir: false });
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly listo = signal(false);

  protected readonly pasos = [
    'Escribe tu contraseña actual.',
    `Escribe la contraseña nueva (mínimo ${LARGO_MINIMO} caracteres) y repítela.`,
    'Presiona "Guardar". Desde ahora entrarás con la contraseña nueva.',
  ];

  abrir(): void {
    this.formulario.reset();
    this.ver.set({ actual: false, nueva: false, repetir: false });
    this.error.set(null);
    this.listo.set(false);
    this.dialogo().nativeElement.showModal();
  }

  /** Muestra u oculta la contraseña de un campo. */
  protected alternar(campo: 'actual' | 'nueva' | 'repetir'): void {
    this.ver.update((v) => ({ ...v, [campo]: !v[campo] }));
  }

  protected cerrar(): void {
    this.dialogo().nativeElement.close();
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);

    const { actual, nueva } = this.formulario.getRawValue();
    this.sesion.cambiarContrasena(actual, nueva).subscribe({
      next: () => {
        this.enviando.set(false);
        this.listo.set(true);
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.error.set(e.error?.detail ?? 'No se pudo cambiar la contraseña. Intenta de nuevo.');
      },
    });
  }
}
