import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { SesionService } from '../../../servicios/sesion-service';
import { Ayuda } from '../../compartidos/ayuda/ayuda';
import { ComoUsar } from '../../compartidos/como-usar/como-usar';
import { Icono } from '../../compartidos/icono/icono';

/** Inicio de sesión (Fig. 1, pseudocódigo 4.2), común a los tres perfiles. */
@Component({
  selector: 'app-iniciar-sesion',
  imports: [ReactiveFormsModule, Ayuda, ComoUsar, Icono],
  templateUrl: './iniciar-sesion.html',
  styleUrl: './iniciar-sesion.css',
})
export class IniciarSesion {
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected readonly verClave = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly pasos = [
    'Escribe el usuario que te entregó tu tienda o el administrador del sistema.',
    'Escribe tu contraseña. Puedes verla con el ícono del ojo.',
    'Presiona "Ingresar". Entrarás a la pantalla que corresponde a tu perfil.',
    'Si tu cuenta o tu tienda fueron dadas de baja, verás "Cuenta inactiva".',
  ];

  protected ingresar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);

    const { username, password } = this.formulario.getRawValue();
    this.sesion.iniciarSesion(username.trim(), password).subscribe({
      next: () => this.router.navigateByUrl(this.sesion.inicio()),
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.error.set(
          e.status === 0
            ? 'No se pudo conectar con el servidor. Intenta de nuevo en un momento.'
            : (e.error?.detail ?? 'Ocurrió un error al iniciar sesión.'),
        );
      },
    });
  }
}
