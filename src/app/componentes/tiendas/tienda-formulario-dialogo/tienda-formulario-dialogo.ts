import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import {
  GIROS_TIENDA,
  TiendaActualizarEntrada,
  TiendaCrearEntrada,
  TiendaItem,
} from '../../../modelo/tienda';
import { Moneda } from '../../../modelo/venta';
import { TiendaService } from '../../../servicios/tienda-service';
import { Ayuda } from '../../compartidos/ayuda/ayuda';
import { ComoUsar } from '../../compartidos/como-usar/como-usar';
import { Icono } from '../../compartidos/icono/icono';

const RUC_REGEX = /^(10|20)\d{9}$/;
const TELEFONO_REGEX = /^\d{9}$/;
const DNI_REGEX = /^\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Genera una contraseña temporal aleatoria segura de 10 caracteres. */
export function generarContrasenaTemporal(): string {
  const mayus = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const minus = 'abcdefghjkmnpqrstuvwxyz';
  const nums = '23456789';
  const todos = mayus + minus + nums;
  const elegir = (pool: string) => pool[Math.floor(Math.random() * pool.length)];
  const caracteres = [elegir(mayus), elegir(minus), elegir(nums), elegir(mayus), elegir(minus), elegir(nums)];
  while (caracteres.length < 10) caracteres.push(elegir(todos));
  return caracteres.join('');
}

/**
 * Modal para registrar o editar una tienda y su dueño (Fig. 3 y 4).
 * Valida localmente con los mensajes exactos de Fig. 4 y refleja los errores
 * por campo (`errores`) devueltos por el backend.
 */
@Component({
  selector: 'app-tienda-formulario-dialogo',
  imports: [ReactiveFormsModule, Ayuda, ComoUsar, Icono],
  templateUrl: './tienda-formulario-dialogo.html',
  styleUrl: './tienda-formulario-dialogo.css',
})
export class TiendaFormularioDialogo {
  private readonly tiendas = inject(TiendaService);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  readonly girosExistentes = input<string[]>([]);
  readonly guardado = output<TiendaItem>();

  protected readonly editando = signal<TiendaItem | null>(null);
  protected readonly esEdicion = computed(() => this.editando() !== null);
  protected readonly verClave = signal(false);
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly erroresCampo = signal<Record<string, string>>({});

  protected readonly giros = computed(() => {
    const conjunto = new Set<string>([...GIROS_TIENDA, ...this.girosExistentes()]);
    const actual = this.editando()?.giro;
    if (actual) conjunto.add(actual);
    return Array.from(conjunto);
  });

  protected readonly pasos = [
    'Completa los datos de la tienda (el RUC debe tener 11 dígitos y empezar con 10 o 20).',
    'Completa los datos del dueño. Al registrar una tienda se crea automáticamente su cuenta de Administrador del negocio.',
    'Puedes usar el botón "Generar" para crear una contraseña temporal segura.',
    'Presiona "Registrar tienda" o "Guardar cambios" para confirmar.',
  ];

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    nombre_comercial: [''],
    ruc: [''],
    direccion: [''],
    distrito: [''],
    telefono: [''],
    giro: [''],
    moneda_defecto: ['PEN' as Moneda],
    logo_url: [''],
    dueno_nombres: [''],
    dueno_dni: [''],
    dueno_email: [''],
    username: [''],
    password: [''],
  });

  abrirCrear(): void {
    this.editando.set(null);
    this.formulario.reset({
      nombre_comercial: '',
      ruc: '',
      direccion: '',
      distrito: '',
      telefono: '',
      giro: '',
      moneda_defecto: 'PEN',
      logo_url: '',
      dueno_nombres: '',
      dueno_dni: '',
      dueno_email: '',
      username: '',
      password: '',
    });
    this.verClave.set(false);
    this.errorGeneral.set(null);
    this.erroresCampo.set({});
    this.dialogo().nativeElement.showModal();
  }

  abrirEditar(tienda: TiendaItem): void {
    this.editando.set(tienda);
    this.formulario.reset({
      nombre_comercial: tienda.nombre_comercial,
      ruc: tienda.ruc ?? '',
      direccion: tienda.direccion ?? '',
      distrito: tienda.distrito ?? '',
      telefono: tienda.telefono ?? '',
      giro: tienda.giro ?? '',
      moneda_defecto: tienda.moneda_defecto,
      logo_url: tienda.logo_url ?? '',
      dueno_nombres: tienda.dueno_nombres,
      dueno_dni: tienda.dueno_dni ?? '',
      dueno_email: tienda.dueno_email ?? '',
      username: tienda.dueno_username,
      password: '',
    });
    this.verClave.set(false);
    this.errorGeneral.set(null);
    this.erroresCampo.set({});
    this.dialogo().nativeElement.showModal();
  }

  protected cerrar(): void {
    this.dialogo().nativeElement.close();
  }

  protected generarClave(): void {
    this.formulario.controls.password.setValue(generarContrasenaTemporal());
    this.verClave.set(true);
    this.limpiarError('password');
  }

  protected limpiarError(campo: string): void {
    if (!this.erroresCampo()[campo]) return;
    this.erroresCampo.update((actual) => {
      const copia = { ...actual };
      delete copia[campo];
      return copia;
    });
  }

  protected validarLocal(): Record<string, string> {
    const v = this.formulario.getRawValue();
    const errores: Record<string, string> = {};

    const nombre = v.nombre_comercial.trim();
    const ruc = v.ruc.trim();
    const direccion = v.direccion.trim();
    const distrito = v.distrito.trim();
    const telefono = v.telefono.trim();
    const giro = v.giro.trim();
    const duenoNombres = v.dueno_nombres.trim();
    const duenoDni = v.dueno_dni.trim();
    const duenoEmail = v.dueno_email.trim();

    if (!nombre) errores['nombre_comercial'] = 'Ingresa el nombre comercial';
    else if (nombre.length > 60) errores['nombre_comercial'] = 'Máximo 60 caracteres';

    if (!RUC_REGEX.test(ruc)) errores['ruc'] = 'Debe tener 11 dígitos y empezar con 10 o 20';

    if (!direccion) errores['direccion'] = 'Ingresa la dirección';
    else if (direccion.length > 200) errores['direccion'] = 'Máximo 200 caracteres';

    if (!distrito) errores['distrito'] = 'Ingresa el distrito';
    else if (distrito.length > 60) errores['distrito'] = 'Máximo 60 caracteres';

    if (!TELEFONO_REGEX.test(telefono)) errores['telefono'] = 'Debe tener 9 dígitos';

    if (!giro) errores['giro'] = 'Selecciona un giro';
    else if (giro.length > 40) errores['giro'] = 'Máximo 40 caracteres';

    if (!duenoNombres) errores['dueno_nombres'] = 'Ingresa nombres y apellidos';
    else if (duenoNombres.length > 80) errores['dueno_nombres'] = 'Máximo 80 caracteres';

    if (!DNI_REGEX.test(duenoDni)) errores['dueno_dni'] = 'Debe tener 8 dígitos';

    if (!duenoEmail || !EMAIL_REGEX.test(duenoEmail)) errores['dueno_email'] = 'Ingresa un correo válido';
    else if (duenoEmail.length > 100) errores['dueno_email'] = 'Máximo 100 caracteres';

    if (!this.esEdicion()) {
      const username = v.username.trim();
      if (username.length < 3) errores['username'] = 'Mínimo 3 caracteres';
      else if (/\s/.test(username)) errores['username'] = 'El usuario no debe contener espacios';
      else if (username.length > 20) errores['username'] = 'Máximo 20 caracteres';

      if (v.password.length < 8) errores['password'] = 'Mínimo 8 caracteres';
    }

    return errores;
  }

  protected guardar(): void {
    this.errorGeneral.set(null);
    const errores = this.validarLocal();
    this.erroresCampo.set(errores);
    if (Object.keys(errores).length > 0) return;

    const v = this.formulario.getRawValue();
    const base: TiendaActualizarEntrada = {
      nombre_comercial: v.nombre_comercial.trim(),
      ruc: v.ruc.trim(),
      direccion: v.direccion.trim(),
      distrito: v.distrito.trim(),
      telefono: v.telefono.trim(),
      giro: v.giro.trim(),
      dueno_nombres: v.dueno_nombres.trim(),
      dueno_dni: v.dueno_dni.trim(),
      dueno_email: v.dueno_email.trim(),
      moneda_defecto: v.moneda_defecto,
      logo_url: v.logo_url.trim() || null,
    };

    this.enviando.set(true);
    const actual = this.editando();
    const peticion = actual
      ? this.tiendas.actualizar(actual.tienda_id, base)
      : this.tiendas.registrar({
          ...base,
          username: v.username.trim(),
          password: v.password,
        } satisfies TiendaCrearEntrada);

    peticion.subscribe({
      next: (tienda) => {
        this.enviando.set(false);
        this.cerrar();
        this.guardado.emit(tienda);
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        const porCampo = e.error?.errores as Record<string, string> | undefined;
        if (porCampo && Object.keys(porCampo).length > 0) {
          this.erroresCampo.set(porCampo);
          return;
        }
        this.errorGeneral.set(
          e.status === 0
            ? 'No se pudo conectar con el servidor. Intenta de nuevo en un momento.'
            : (e.error?.detail ?? 'No se pudo guardar la tienda.'),
        );
      },
    });
  }
}
